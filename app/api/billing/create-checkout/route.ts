import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

// Price IDs by plan — set in Vercel environment variables
const PRICE_IDS: Record<string, string> = {
  monthly:    process.env.STRIPE_PRICE_MONTHLY ?? '',
  annual:     process.env.STRIPE_PRICE_ANNUAL  ?? '',
  three_year: process.env.STRIPE_PRICE_3YEAR   ?? '',
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { planId } = body as { planId: string }

  const priceId = PRICE_IDS[planId]
  if (!priceId) {
    return NextResponse.json({ error: `Unknown plan: ${planId}` }, { status: 400 })
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    customer_email: user.email ?? undefined,
    subscription_data: {
      trial_period_days: 7,
      metadata: { userId: user.id, planId },
    },
    success_url: `${baseUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/subscribe`,
    metadata: { userId: user.id, planId },
  })

  return NextResponse.json({ url: session.url })
}
