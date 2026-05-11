import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

/**
 * POST /api/billing/webhook
 *
 * Receives Stripe webhook events and updates the user's billing state in Supabase.
 *
 * Required Stripe events to enable in the dashboard:
 *   - checkout.session.completed
 *   - customer.subscription.updated
 *   - customer.subscription.deleted
 *   - invoice.payment_failed
 *
 * Required env vars:
 *   STRIPE_SECRET_KEY
 *   STRIPE_WEBHOOK_SECRET
 */
export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  // TODO: Install Stripe and uncomment the verification + handling below.
  // import Stripe from 'stripe'
  // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
  //
  // let event: Stripe.Event
  // try {
  //   event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  // } catch {
  //   return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  // }
  //
  // const service = createServiceClient()
  //
  // switch (event.type) {
  //   case 'checkout.session.completed': {
  //     const session = event.data.object as Stripe.Checkout.Session
  //     const userId = session.metadata?.userId
  //     const planId = session.metadata?.planId
  //     if (!userId || !planId) break
  //
  //     await service.from('profiles').update({
  //       stripe_customer_id: session.customer as string,
  //       plan_type: planId,
  //       subscription_status: planId === 'three_year' ? 'active' : 'active',
  //       plan_expires_at: planId === 'three_year'
  //         ? new Date(Date.now() + 3 * 365 * 24 * 60 * 60 * 1000).toISOString()
  //         : null,
  //       user_role: 'general', // upgrade student/general to general with access
  //     }).eq('id', userId)
  //     break
  //   }
  //
  //   case 'customer.subscription.updated': {
  //     const sub = event.data.object as Stripe.Subscription
  //     // update status based on sub.status
  //     break
  //   }
  //
  //   case 'customer.subscription.deleted': {
  //     // mark as canceled
  //     break
  //   }
  //
  //   case 'invoice.payment_failed': {
  //     // mark as past_due
  //     break
  //   }
  // }

  return NextResponse.json({ received: true })
}
