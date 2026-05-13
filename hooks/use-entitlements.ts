'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Entitlements {
  isPro: boolean
  isTrialing: boolean
  isLoading: boolean
}

export function useEntitlements(): Entitlements {
  const [isPro, setIsPro] = useState(false)
  const [isTrialing, setIsTrialing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function check() {
      try {
        const { Capacitor } = await import('@capacitor/core')

        if (Capacitor.isNativePlatform()) {
          // iOS: check RevenueCat CustomerInfo for 'pro' entitlement
          const { Purchases } = await import('@revenuecat/purchases-capacitor')
          const { customerInfo } = await Purchases.getCustomerInfo()
          if (!cancelled) {
            setIsPro('pro' in customerInfo.entitlements.active)
            setIsTrialing(false)
          }
        } else {
          // Web: check Supabase profile subscription_status
          const supabase = createClient()
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) { setIsLoading(false); return }

          const { data: profile } = await supabase
            .from('profiles')
            .select('subscription_status, trial_ends_at, plan_type, user_role')
            .eq('id', user.id)
            .single()

          if (!cancelled && profile) {
            const role = profile.user_role as string
            const status = profile.subscription_status as string
            const trialing = status === 'trialing' &&
              !!profile.trial_ends_at &&
              new Date(profile.trial_ends_at) > new Date()

            setIsPro(role === 'admin' || status === 'active' || trialing)
            setIsTrialing(trialing)
          }
        }
      } catch (err) {
        console.error('useEntitlements error:', err)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    check()
    return () => { cancelled = true }
  }, [])

  return { isPro, isTrialing, isLoading }
}
