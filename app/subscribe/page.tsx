'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Zap, ChevronRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { resolveEntitlement, type BillingProfile } from '@/lib/entitlements'

const PLANS = [
  {
    id: 'monthly',
    name: 'Monthly',
    price: '$7/mo',
    detail: 'Billed monthly',
    highlighted: false,
  },
  {
    id: 'annual',
    name: 'Annual',
    price: '$5/mo',
    detail: 'Billed $60/year',
    highlighted: true,
    badge: 'Most Popular',
  },
  {
    id: 'three_year',
    name: '3-Year',
    price: '$100',
    detail: 'One payment, 3 years',
    highlighted: false,
    badge: 'Best Deal',
  },
] as const

export default function SubscribePage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState<string | null>(null)
  const [checking, setChecking] = useState(true)

  // If user already has access, send them home
  useEffect(() => {
    async function check() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/auth/login'); return }

      const { data: profile } = await supabase
        .from('profiles')
        .select('user_role, plan_type, subscription_status, trial_ends_at, plan_expires_at')
        .eq('id', user.id)
        .single()

      if (profile) {
        const ent = resolveEntitlement(profile as BillingProfile)
        if (ent.hasAccess) { router.replace('/'); return }
      }
      setChecking(false)
    }
    check()
  }, [supabase, router])

  const handleSubscribe = async (planId: string) => {
    setLoading(planId)
    try {
      const res = await fetch('/api/billing/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      })
      const { url, error } = await res.json()
      if (error) throw new Error(error)
      window.location.href = url
    } catch {
      setLoading(null)
    }
  }

  if (checking) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center px-4 py-12 bg-background">
      <div className="w-full max-w-md flex flex-col gap-8">
        {/* Icon + heading */}
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
            <Zap className="size-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Your trial has ended</h1>
            <p className="mt-2 text-muted-foreground">
              Subscribe to continue using Verbatim — all features included in every plan.
            </p>
          </div>
        </div>

        {/* Plan cards */}
        <div className="flex flex-col gap-3">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`flex items-center justify-between rounded-xl border px-5 py-4 ${
                plan.highlighted ? 'border-primary bg-primary/5' : 'bg-card'
              }`}
            >
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{plan.name}</span>
                  {'badge' in plan && plan.badge && (
                    <Badge className="text-xs">{plan.badge}</Badge>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">{plan.detail}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold">{plan.price}</span>
                <Button
                  size="sm"
                  variant={plan.highlighted ? 'default' : 'outline'}
                  disabled={loading !== null}
                  onClick={() => handleSubscribe(plan.id)}
                  className="gap-1"
                >
                  {loading === plan.id ? <Loader2 className="size-3 animate-spin" /> : null}
                  Choose
                  <ChevronRight className="size-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-muted-foreground">
          By subscribing you agree to our{' '}
          <Link href="/terms" className="underline">Terms of Service</Link>{' '}
          and{' '}
          <Link href="/privacy" className="underline">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  )
}
