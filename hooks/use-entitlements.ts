'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { resolveEntitlement, type Entitlement, type BillingProfile } from '@/lib/entitlements'
import { FEATURE_FLAGS, roleHasAccess, type FeatureFlagKey } from '@/lib/feature-flags'

const DEFAULT_ENTITLEMENT: Entitlement = {
  hasAccess: true,      // optimistic while loading — middleware catches real access
  tier: 'general',
  isTrial: true,
  trialEndsAt: null,
  isActive: false,
  needsSubscription: false,
  planType: 'none',
  status: 'trialing',
}

/**
 * Fetches the current user's billing profile and resolves their entitlement.
 * Refreshes automatically when the Supabase session changes.
 */
export function useEntitlements() {
  const supabase = createClient()
  const [entitlement, setEntitlement] = useState<Entitlement>(DEFAULT_ENTITLEMENT)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    async function fetchEntitlement() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || !mounted) {
        setLoading(false)
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('user_role, plan_type, subscription_status, trial_ends_at, plan_expires_at')
        .eq('id', user.id)
        .single()

      if (!mounted) return

      if (profile) {
        setEntitlement(resolveEntitlement(profile as BillingProfile))
      }
      setLoading(false)
    }

    fetchEntitlement()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchEntitlement()
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [supabase])

  /** Returns true if the user has access to the named feature */
  function canUse(flag: FeatureFlagKey): boolean {
    const def = FEATURE_FLAGS[flag]
    return roleHasAccess(entitlement.tier, def.access)
  }

  return { entitlement, loading, canUse }
}

/**
 * Lightweight hook — only returns whether the user has app access.
 * Useful for paywall checks without the full entitlement object.
 */
export function useHasAccess(): { hasAccess: boolean; loading: boolean } {
  const { entitlement, loading } = useEntitlements()
  return { hasAccess: entitlement.hasAccess, loading }
}
