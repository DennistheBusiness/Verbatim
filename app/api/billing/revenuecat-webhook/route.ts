import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

// RC sends the Authorization header value you configured in the dashboard
function isAuthorized(request: NextRequest): boolean {
  const auth = request.headers.get('authorization')
  const expected = `Bearer ${process.env.REVENUECAT_WEBHOOK_AUTH}`
  return auth === expected
}

interface RCWebhookEvent {
  event: {
    type: string
    app_user_id: string
    product_id?: string
    expiration_at_ms?: number
    period_type?: string
  }
}

function planTypeFromProductId(productId?: string): string {
  if (!productId) return 'pro'
  if (productId.includes('annual') || productId.includes('vyear')) return 'annual'
  if (productId.includes('monthly') || productId.includes('vmonth')) return 'monthly'
  return 'pro'
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: RCWebhookEvent
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { type, app_user_id, product_id, expiration_at_ms } = body.event

  if (!app_user_id) {
    return NextResponse.json({ error: 'Missing app_user_id' }, { status: 400 })
  }

  const supabase = createServiceClient()

  switch (type) {
    case 'INITIAL_PURCHASE':
    case 'RENEWAL':
    case 'REACTIVATED': {
      const planExpiresAt = expiration_at_ms
        ? new Date(expiration_at_ms).toISOString()
        : null
      await supabase
        .from('profiles')
        .update({
          subscription_status: 'active',
          plan_type: planTypeFromProductId(product_id),
          ...(planExpiresAt ? { plan_expires_at: planExpiresAt } : {}),
        })
        .eq('id', app_user_id)
      break
    }

    case 'CANCELLATION':
    case 'EXPIRATION': {
      await supabase
        .from('profiles')
        .update({ subscription_status: 'canceled' })
        .eq('id', app_user_id)
      break
    }

    case 'BILLING_ISSUE': {
      await supabase
        .from('profiles')
        .update({ subscription_status: 'past_due' })
        .eq('id', app_user_id)
      break
    }

    case 'PAUSE': {
      await supabase
        .from('profiles')
        .update({ subscription_status: 'paused' })
        .eq('id', app_user_id)
      break
    }

    default:
      // Unhandled event types (TEST, TRANSFER, etc.) — acknowledge but no-op
      break
  }

  return NextResponse.json({ received: true })
}
