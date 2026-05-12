'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Zap, X, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { resolveEntitlement, trialDaysRemaining, type BillingProfile } from '@/lib/entitlements'

const PLAN_LABELS: Record<string, string> = {
  monthly:    'Monthly Plan',
  annual:     'Annual Plan',
  three_year: '3-Year Plan',
}

type BannerType = 'trial' | 'subscribed_trial' | 'past_due' | 'canceling'

interface BannerState {
  type: BannerType
  daysLeft?: number
  planLabel?: string
}

/**
 * HomeBillingBanner — shown only on the library/home page.
 *
 * Three states:
 *  - trial          : amber strip, user is in free trial, not yet subscribed → links to /pricing
 *  - subscribed_trial: green strip, user subscribed but trial days still running
 *  - past_due       : red strip, payment failed
 *
 * Dismissed per-session (sessionStorage). Auto-hides when no longer relevant.
 */
export function TrialBanner() {
  const supabase = createClient()
  const router = useRouter()
  const [banner, setBanner] = useState<BannerState | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (sessionStorage.getItem('billingBannerDismissed')) {
      setDismissed(true)
      return
    }

    async function check() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('user_role, plan_type, subscription_status, trial_ends_at, plan_expires_at')
        .eq('id', user.id)
        .single()

      if (!profile) return

      const ent = resolveEntitlement(profile as BillingProfile)

      if (ent.status === 'past_due') {
        setBanner({ type: 'past_due' })
        return
      }

      if (profile.subscription_status === 'canceling') {
        setBanner({ type: 'canceling' })
        return
      }

      if (ent.isTrial && ent.trialEndsAt) {
        const days = trialDaysRemaining(ent.trialEndsAt)
        // No more trial days — don't show banner
        if (days < 0) return

        const hasRealPlan = ['monthly', 'annual', 'three_year'].includes(profile.plan_type)
        const planLabel = PLAN_LABELS[profile.plan_type] ?? undefined

        if (hasRealPlan) {
          // Subscribed but trial is still running — green banner
          setBanner({ type: 'subscribed_trial', daysLeft: days, planLabel })
        } else {
          // Free trial, not yet subscribed — amber banner
          setBanner({ type: 'trial', daysLeft: days })
        }
      }
    }

    check()
  }, [supabase])

  const dismiss = () => {
    sessionStorage.setItem('billingBannerDismissed', '1')
    setDismissed(true)
  }

  if (!banner || dismissed) return null

  const isSubscribedTrial = banner.type === 'subscribed_trial'
  const isPastDue = banner.type === 'past_due'
  const isCanceling = banner.type === 'canceling'

  const dayText = banner.daysLeft === 0
    ? 'today'
    : banner.daysLeft === 1
    ? '1 free day'
    : `${banner.daysLeft} free days`

  const message = (() => {
    if (isPastDue) return 'Your payment failed. Please update your payment method to keep access.'
    if (isCanceling) return 'Your subscription is cancelled — you keep access until the end of your billing period.'
    if (isSubscribedTrial) {
      return banner.daysLeft === 0
        ? `${banner.planLabel ?? 'Plan'} · Your free trial ends today`
        : `${banner.planLabel ?? 'Plan'} · ${dayText} left in your free trial`
    }
    // trial (unsubscribed)
    if (banner.daysLeft === 0) return 'Your free trial ends today — subscribe to keep access.'
    if (banner.daysLeft === 1) return 'Last day of your free trial — subscribe to keep access.'
    if ((banner.daysLeft ?? 8) <= 3) return `Free trial: ${banner.daysLeft} days left — subscribe to keep access.`
    return `Free trial active — ${banner.daysLeft} days remaining`
  })()

  const accentClass = isPastDue
    ? 'bg-destructive/10 border-b border-destructive/20 text-destructive'
    : isCanceling
    ? 'bg-orange-500/10 border-b border-orange-500/20 text-orange-700 dark:text-orange-400'
    : isSubscribedTrial
    ? 'bg-emerald-500/10 border-b border-emerald-500/20 text-emerald-700 dark:text-emerald-400'
    : 'bg-amber-500/10 border-b border-amber-500/20 text-amber-700 dark:text-amber-400'

  const Icon = isPastDue ? AlertTriangle : isCanceling ? AlertTriangle : isSubscribedTrial ? CheckCircle2 : Zap

  const stripContent = (
    <div className={`flex items-center justify-between gap-3 px-4 py-2.5 text-sm ${accentClass}`}>
      <div className="flex items-center gap-2 min-w-0">
        <Icon className="size-4 shrink-0" />
        <span className="truncate font-medium">{message}</span>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {isPastDue && (
          <button
            onClick={() => router.push('/account')}
            className="font-semibold underline underline-offset-4 whitespace-nowrap hover:opacity-80 transition-opacity text-sm"
          >
            Update payment
          </button>
        )}
        {isCanceling && (
          <button
            onClick={() => router.push('/pricing')}
            className="font-semibold underline underline-offset-4 whitespace-nowrap hover:opacity-80 transition-opacity text-sm"
          >
            Resubscribe
          </button>
        )}
        <button
          onClick={dismiss}
          aria-label="Dismiss banner"
          className="opacity-60 hover:opacity-100 transition-opacity"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  )

  // Trial banner (unsubscribed) is fully clickable → /pricing
  if (!isSubscribedTrial && !isPastDue && !isCanceling) {
    return (
      <button
        className="block w-full text-left"
        onClick={() => router.push('/pricing')}
        aria-label="View pricing"
      >
        {stripContent}
      </button>
    )
  }

  return stripContent
}
