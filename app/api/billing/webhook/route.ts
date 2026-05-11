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
  } catch (err) {
    console.error('[webhook] Invalid signature:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const service = createServiceClient()

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.userId
        const planId = session.metadata?.planId

        if (!userId || !planId) {
          console.error('[webhook] checkout.session.completed missing metadata', {
            sessionId: session.id,
            metadata: session.metadata,
          })
          break
        }

        // Retrieve the subscription to check if it is in a trial period.
        let subscriptionStatus: string = 'active'
        let trialEndsAt: string | undefined

        if (session.subscription) {
          const sub = await stripe.subscriptions.retrieve(session.subscription as string)
          if (sub.status === 'trialing' && sub.trial_end) {
            subscriptionStatus = 'trialing'
            trialEndsAt = new Date(sub.trial_end * 1000).toISOString()
          }
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const checkoutPayload: any = {
          stripe_customer_id: session.customer as string,
          plan_type: planId,
          subscription_status: subscriptionStatus,
          ...(trialEndsAt ? { trial_ends_at: trialEndsAt } : {}),
        }

        const { error: checkoutErr } = await service
          .from('profiles')
          .update(checkoutPayload)
          .eq('id', userId)

        if (checkoutErr) {
          console.error('[webhook] Supabase update failed for checkout.session.completed', {
            userId,
            error: checkoutErr,
          })
          return NextResponse.json({ error: 'DB update failed' }, { status: 500 })
        }

        console.log('[webhook] checkout.session.completed updated profile', { userId, planId, subscriptionStatus })
        break
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription
        const userId = sub.metadata?.userId
        const customerId = sub.customer as string

        const status = sub.status === 'active' ? 'active'
          : sub.status === 'past_due' ? 'past_due'
          : sub.status === 'canceled' ? 'canceled'
          : sub.status === 'paused' ? 'paused'
          : 'trialing'

        if (userId) {
          const { error } = await service
            .from('profiles')
            .update({ subscription_status: status })
            .eq('id', userId)
          if (error) {
            console.error('[webhook] subscription.updated failed (userId)', { userId, error })
            return NextResponse.json({ error: 'DB update failed' }, { status: 500 })
          }
        } else if (customerId) {
          // Fallback: look up by stripe_customer_id if userId metadata is missing
          const { error } = await service
            .from('profiles')
            .update({ subscription_status: status })
            .eq('stripe_customer_id', customerId)
          if (error) {
            console.error('[webhook] subscription.updated failed (customerId)', { customerId, error })
            return NextResponse.json({ error: 'DB update failed' }, { status: 500 })
          }
        } else {
          console.error('[webhook] subscription.updated: no userId or customerId', { subId: sub.id })
        }
        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        const userId = sub.metadata?.userId
        const customerId = sub.customer as string

        if (userId) {
          const { error } = await service
            .from('profiles')
            .update({ subscription_status: 'canceled', plan_type: 'none' })
            .eq('id', userId)
          if (error) {
            console.error('[webhook] subscription.deleted failed (userId)', { userId, error })
            return NextResponse.json({ error: 'DB update failed' }, { status: 500 })
          }
        } else if (customerId) {
          const { error } = await service
            .from('profiles')
            .update({ subscription_status: 'canceled', plan_type: 'none' })
            .eq('stripe_customer_id', customerId)
          if (error) {
            console.error('[webhook] subscription.deleted failed (customerId)', { customerId, error })
            return NextResponse.json({ error: 'DB update failed' }, { status: 500 })
          }
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string
        if (!customerId) break

        const { error } = await service
          .from('profiles')
          .update({ subscription_status: 'past_due' })
          .eq('stripe_customer_id', customerId)

        if (error) {
          console.error('[webhook] invoice.payment_failed update failed', { customerId, error })
          return NextResponse.json({ error: 'DB update failed' }, { status: 500 })
        }
        break
      }
    }
  } catch (err) {
    console.error('[webhook] Unhandled error processing event', { type: event.type, err })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
