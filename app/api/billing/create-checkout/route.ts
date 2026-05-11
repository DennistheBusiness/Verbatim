import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Price IDs by plan — set these in .env.local
const PRICE_IDS: Record<string, string> = {
  monthly:    process.env.STRIPE_MONTHLY_PRICE_ID    ?? '',
  annual:     process.env.STRIPE_ANNUAL_PRICE_ID     ?? '',
  three_year: process.env.STRIPE_THREE_YEAR_PRICE_ID ?? '',
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

  // Lazy-load Stripe (not installed yet — install with: pnpm add stripe)
  // import Stripe from 'stripe'
  // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
  //
  // const session = await stripe.checkout.sessions.create({
  //   mode: planId === 'three_year' ? 'payment' : 'subscription',
  //   line_items: [{ price: priceId, quantity: 1 }],
  //   customer_email: user.email,
  //   success_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
  //   cancel_url:  `${process.env.NEXT_PUBLIC_APP_URL}/subscribe`,
  //   metadata: { userId: user.id, planId },
  // })
  // return NextResponse.json({ url: session.url })

  // TODO: Install Stripe and uncomment above. Placeholder response:
  return NextResponse.json(
    { error: 'Stripe not yet configured. Add STRIPE_SECRET_KEY to .env.local and install the stripe package.' },
    { status: 501 }
  )
}
