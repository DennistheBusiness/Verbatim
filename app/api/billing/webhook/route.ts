import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import Stripe from 'stripe'

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

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const service = createServiceClient()

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.metadata?.userId
      const planId = session.metadata?.planId
      if (!userId || !planId) break

      // Retrieve the subscription to check if it is in a trial period.
      // If so, preserve the trial so users always get their 7 free days
      // even after subscribing. The subscription.updated event will flip
      // the status to 'active' once the trial ends.
      let subscriptionStatus: string = 'active'
      let trialEndsAt: string | undefined

      if (session.subscription) {
        const sub = await stripe.subscriptions.retrieve(session.subscription as string)
        if (sub.status === 'trialing' && sub.trial_end) {
          subscriptionStatus = 'trialing'
          trialEndsAt = new Date(sub.trial_end * 1000).toISOString()
        }
      }

      await service.from('profiles').update({
        stripe_customer_id: session.customer as string,
        plan_type: planId,
        subscription_status: subscriptionStatus,
        ...(trialEndsAt ? { trial_ends_at: trialEndsAt } : {}),
      }).eq('id', userId)
      break
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      const userId = sub.metadata?.userId
      if (!userId) break
      const status = sub.status === 'active' ? 'active'
        : sub.status === 'past_due' ? 'past_due'
        : sub.status === 'canceled' ? 'canceled'
        : sub.status === 'paused' ? 'paused'
        : 'trialing'
      await service.from('profiles').update({ subscription_status: status }).eq('id', userId)
      break
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      const userId = sub.metadata?.userId
      if (!userId) break
      await service.from('profiles').update({
        subscription_status: 'canceled',
        plan_type: 'none',
      }).eq('id', userId)
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      const customerId = invoice.customer as string
      if (!customerId) break
      await service.from('profiles').update({ subscription_status: 'past_due' })
        .eq('stripe_customer_id', customerId)
      break
    }
  }

  return NextResponse.json({ received: true })
}
