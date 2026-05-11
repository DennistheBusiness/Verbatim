import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .single()

  if (!profile?.stripe_customer_id) {
    return NextResponse.json({ error: 'No active subscription found' }, { status: 404 })
  }

  // TODO: Install Stripe and uncomment:
  // import Stripe from 'stripe'
  // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
  // const session = await stripe.billingPortal.sessions.create({
  //   customer: profile.stripe_customer_id,
  //   return_url: `${process.env.NEXT_PUBLIC_APP_URL}/account`,
  // })
  // return NextResponse.json({ url: session.url })

  return NextResponse.json(
    { error: 'Stripe not yet configured.' },
    { status: 501 }
  )
}
