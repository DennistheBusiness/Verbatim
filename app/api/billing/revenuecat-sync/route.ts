import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

function planTypeFromProductId(productId?: string): string {
  if (!productId) return 'pro'
  if (productId.includes('annual') || productId.includes('vyear')) return 'annual'
  if (productId.includes('monthly') || productId.includes('vmonth')) return 'monthly'
  return 'pro'
}

// POST /api/billing/revenuecat-sync
// Called immediately after a successful RevenueCat purchase or restore on mobile.
// Mirrors what sync-session does for Stripe — writes the billing state to Supabase
// without waiting for the async RC webhook to arrive.
// Auth: requires a valid Supabase session (user must be signed in).
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { productId?: string; expirationDate?: string | null }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const planType = planTypeFromProductId(body.productId)
  const service = createServiceClient()

  const { error } = await service
    .from('profiles')
    .update({
      subscription_status: 'active',
      plan_type: planType,
      ...(body.expirationDate ? { plan_expires_at: body.expirationDate } : {}),
    })
    .eq('id', user.id)

  if (error) {
    console.error('[revenuecat-sync] Supabase update failed', { userId: user.id, error })
    return NextResponse.json({ error: 'DB update failed' }, { status: 500 })
  }

  return NextResponse.json({ success: true, planType })
}
