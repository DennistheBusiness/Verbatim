'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Zap, X, AlertTriangle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { resolveEntitlement, trialDaysRemaining, type BillingProfile } from '@/lib/entitlements'

/**
 * TrialBanner — shown at the top of the app when:
 *   - User is in trial with ≤ 3 days remaining
 *   - User is past_due
 *
 * Dismisses for the current session only (stores in sessionStorage).
 */
export function TrialBanner() {
  const supabase = createClient()
  const [banner, setBanner] = useState<{
    type: 'trial' | 'past_due'
    daysLeft?: number
  } | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (sessionStorage.getItem('trialBannerDismissed')) {
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

      if (ent.isTrial && ent.trialEndsAt) {
        const days = trialDaysRemaining(ent.trialEndsAt)
        if (days <= 3) {
          setBanner({ type: 'trial', daysLeft: days })
        }
      }
    }

    check()
  }, [supabase])

  const dismiss = () => {
    sessionStorage.setItem('trialBannerDismissed', '1')
    setDismissed(true)
  }

  if (!banner || dismissed) return null

  const isPastDue = banner.type === 'past_due'

  return (
    <div
      className={`flex items-center justify-between gap-3 px-4 py-2.5 text-sm ${
        isPastDue
          ? 'bg-destructive/10 border-b border-destructive/20 text-destructive'
          : 'bg-amber-500/10 border-b border-amber-500/20 text-amber-700 dark:text-amber-400'
      }`}
    >
      <div className="flex items-center gap-2 min-w-0">
        {isPastDue ? (
          <AlertTriangle className="size-4 shrink-0" />
        ) : (
          <Zap className="size-4 shrink-0" />
        )}
        <span className="truncate">
          {isPastDue
            ? 'Your payment failed. Please update your payment method to keep access.'
            : banner.daysLeft === 0
            ? 'Your free trial ends today.'
            : `Your free trial ends in ${banner.daysLeft} day${banner.daysLeft === 1 ? '' : 's'}.`}
        </span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Link
          href={isPastDue ? '/account' : '/pricing'}
          className="font-semibold underline underline-offset-4 whitespace-nowrap hover:opacity-80 transition-opacity"
        >
          {isPastDue ? 'Update payment' : 'Subscribe now'}
        </Link>
        <button
          onClick={dismiss}
          aria-label="Dismiss"
          className="opacity-60 hover:opacity-100 transition-opacity"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  )
}
