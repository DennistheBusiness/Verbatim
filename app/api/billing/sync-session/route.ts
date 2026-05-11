import { NextResponse, type NextRequest } from 'next/server'
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
 * Auth: Does NOT require the user's browser session. Ownership is validated
 * through Stripe — the sessionId must correspond to a session whose metadata
 * contains a valid userId. This makes it resilient to Apple Pay / external
 * browser flows where the Supabase cookie is not carried back.
 *
 * Returns the full subscription state including trial_end so the UI
 * can render accurate trial-days-remaining messaging.
 */
export async function POST(request: NextRequest) {
  const { sessionId } = await request.json() as { sessionId?: string }
  if (!sessionId) {
    return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 })
  }

  // Retrieve the checkout session and expand the subscription.
  // We trust Stripe as the authority — the userId in metadata was written
  // by our server at checkout creation time and cannot be spoofed by the client.
  let session: Stripe.Checkout.Session
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription'],
    })
  } catch (err) {
    console.error('[sync-session] Failed to retrieve Stripe session', { sessionId, err })
    return NextResponse.json({ error: 'Invalid session' }, { status: 400 })
  }

  // userId from Stripe metadata is our source of truth — no browser session needed
  const userId = session.metadata?.userId
  const planId = session.metadata?.planId ?? 'monthly'

  if (!userId) {
    console.error('[sync-session] Session missing userId metadata', { sessionId })
    return NextResponse.json({ error: 'Session metadata incomplete' }, { status: 400 })
  }

  const customerId = session.customer as string
  const sub = session.subscription as Stripe.Subscription | null

  // Determine status and trial_end from the subscription
  const isTrial = sub?.status === 'trialing'
  const subscriptionStatus = isTrial ? 'trialing' : 'active'
  const trialEndsAt = isTrial && sub?.trial_end
    ? new Date(sub.trial_end * 1000).toISOString()
    : null

  // Update Supabase using the service role key — bypasses RLS and browser session
  const service = createServiceClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updatePayload: any = {
    stripe_customer_id: customerId,
    plan_type: planId,
    subscription_status: subscriptionStatus,
    ...(trialEndsAt ? { trial_ends_at: trialEndsAt } : {}),
  }

  const { error: updateError } = await service
    .from('profiles')
    .update(updatePayload)
    .eq('id', userId)  // profiles.id is the most reliable lookup — set during checkout

  if (updateError) {
    console.error('[sync-session] Supabase update failed', { userId, error: updateError })
    return NextResponse.json({ error: 'DB update failed' }, { status: 500 })
  }

  console.log('[sync-session] Profile updated successfully', { userId, planId, subscriptionStatus })

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
