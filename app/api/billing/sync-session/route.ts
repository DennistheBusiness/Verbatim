import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

/**
 * POST /api/billing/sync-session
 *
 * Called immediately from /billing/success after checkout completes.
 * Retrieves the Stripe checkout session + subscription, then directly
 * writes the billing state to Supabase — bypassing webhook delivery delays.
 *
 * Returns the full subscription state including trial_end so the UI
 * can render accurate trial-days-remaining messaging.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { sessionId } = await request.json() as { sessionId: string }
  if (!sessionId) {
    return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 })
  }

  // Retrieve the checkout session and expand the subscription
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ['subscription'],
  })

  // Validate that this session belongs to the logged-in user
  const userId = session.metadata?.userId
  if (userId !== user.id) {
    return NextResponse.json({ error: 'Session mismatch' }, { status: 403 })
  }

  const planId = session.metadata?.planId ?? 'monthly'
  const customerId = session.customer as string

  const sub = session.subscription as Stripe.Subscription | null

  // Determine status and trial_end from the subscription
  const isTrial = sub?.status === 'trialing'
  const subscriptionStatus = isTrial ? 'trialing' : 'active'
  const trialEndsAt = isTrial && sub?.trial_end
    ? new Date(sub.trial_end * 1000).toISOString()
    : null

  // Update Supabase profile directly — this is idempotent and safe
  const service = createServiceClient()
  const updatePayload: Record<string, unknown> = {
    stripe_customer_id: customerId,
    plan_type: planId,
    subscription_status: subscriptionStatus,
  }
  if (trialEndsAt) {
    updatePayload.trial_ends_at = trialEndsAt
  }

  await service
    .from('profiles')
    .update(updatePayload)
    .eq('id', user.id)

  // Calculate trial days remaining for UI display
  let trialDaysLeft: number | null = null
  if (trialEndsAt) {
    const msLeft = new Date(trialEndsAt).getTime() - Date.now()
    trialDaysLeft = Math.max(0, Math.ceil(msLeft / (1000 * 60 * 60 * 24)))
  }

  const planLabels: Record<string, string> = {
    monthly: 'Monthly Plan',
    annual: 'Annual Plan',
    three_year: '3-Year Plan',
  }

  return NextResponse.json({
    success: true,
    planId,
    planLabel: planLabels[planId] ?? 'Plan',
    subscriptionStatus,
    isTrial,
    trialEndsAt,
    trialDaysLeft,
    customerId,
  })
}
