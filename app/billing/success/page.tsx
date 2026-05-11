'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, Loader2, ArrowRight, Zap, CalendarDays, CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface SyncResult {
  planLabel: string
  subscriptionStatus: string
  isTrial: boolean
  trialEndsAt: string | null
  trialDaysLeft: number | null
}

function SuccessContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const sessionId = searchParams.get('session_id')

  const [status, setStatus] = useState<'loading' | 'confirmed' | 'error'>('loading')
  const [result, setResult] = useState<SyncResult | null>(null)

  useEffect(() => {
    if (!sessionId) { setStatus('error'); return }

    async function sync() {
      try {
        const res = await fetch('/api/billing/sync-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        })
        const data = await res.json()
        if (!res.ok || !data.success) throw new Error(data.error ?? 'Sync failed')
        setResult(data as SyncResult)
        setStatus('confirmed')
      } catch {
        // Fallback — show success even if sync fails (webhook will eventually update)
        setStatus('confirmed')
      }
    }

    sync()
  }, [sessionId])

  if (status === 'loading') {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-5 px-4">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="text-muted-foreground text-sm">Confirming your subscription…</p>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-6 px-4 text-center">
        <p className="text-muted-foreground">Something went wrong confirming your subscription.</p>
        <Button asChild variant="outline">
          <Link href="/subscribe">Try again</Link>
        </Button>
      </div>
    )
  }

  const isTrial = result?.isTrial ?? false
  const daysLeft = result?.trialDaysLeft ?? null
  const planLabel = result?.planLabel ?? 'Verbatim'

  const trialEndDate = result?.trialEndsAt
    ? new Date(result.trialEndsAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })
    : null

  return (
    <div className="flex min-h-svh flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md flex flex-col items-center gap-8 text-center">

        {/* Icon */}
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-emerald-500/20 blur-2xl scale-150" />
          <div className="relative flex size-24 items-center justify-center rounded-full bg-emerald-500/10 border-2 border-emerald-500/30">
            <CheckCircle2 className="size-12 text-emerald-600 dark:text-emerald-400" strokeWidth={1.5} />
          </div>
        </div>

        {/* Heading */}
        <div className="flex flex-col gap-2">
          <Badge variant="outline" className="mx-auto w-fit text-emerald-600 border-emerald-500/40 bg-emerald-500/5">
            Subscription confirmed
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome to {planLabel}!
          </h1>
          <p className="text-muted-foreground">
            {isTrial
              ? `Your free trial is running — enjoy full access at no charge.`
              : `Full access to every Verbatim feature, every day.`}
          </p>
        </div>

        {/* Subscription detail card */}
        <div className="w-full rounded-2xl border bg-card shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b bg-muted/30">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Membership details</p>
          </div>
          <div className="divide-y">
            <div className="flex items-center justify-between px-5 py-3.5 gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CreditCard className="size-4 shrink-0" />
                Plan
              </div>
              <span className="text-sm font-semibold">{planLabel}</span>
            </div>

            <div className="flex items-center justify-between px-5 py-3.5 gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Zap className="size-4 shrink-0" />
                Status
              </div>
              <span className={`text-sm font-semibold ${
                isTrial ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
              }`}>
                {isTrial ? 'Free trial active' : 'Active'}
              </span>
            </div>

            {isTrial && daysLeft !== null && (
              <div className="flex items-center justify-between px-5 py-3.5 gap-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CalendarDays className="size-4 shrink-0" />
                  Trial days left
                </div>
                <span className="text-sm font-semibold">
                  {daysLeft === 0 ? 'Ends today' : `${daysLeft} day${daysLeft === 1 ? '' : 's'}`}
                </span>
              </div>
            )}

            {isTrial && trialEndDate && (
              <div className="flex items-center justify-between px-5 py-3.5 gap-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CalendarDays className="size-4 shrink-0" />
                  First charge
                </div>
                <span className="text-sm font-semibold">{trialEndDate}</span>
              </div>
            )}
          </div>
        </div>

        {isTrial && (
          <p className="text-sm text-muted-foreground">
            🎉 You won’t be charged until your trial ends. Cancel any time in Account Settings.
          </p>
        )}

        {/* CTAs */}
        <div className="flex flex-col gap-3 w-full">
          <Button size="lg" className="w-full gap-2" onClick={() => router.push('/')}>
            Go to my library
            <ArrowRight className="size-4" />
          </Button>
          <Button size="lg" variant="outline" className="w-full gap-2" onClick={() => router.push('/create')}>
            Create a memorization set
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Manage your subscription any time in{' '}
          <Link href="/account" className="underline underline-offset-4">Account Settings</Link>.
        </p>
      </div>
    </div>
  )
}

export default function BillingSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-svh items-center justify-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  )
}


function SuccessContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const sessionId = searchParams.get('session_id')
  const supabase = createClient()

  const [status, setStatus] = useState<'loading' | 'confirmed' | 'error'>('loading')
  const [planLabel, setPlanLabel] = useState<string>('')

  useEffect(() => {
    if (!sessionId) {
      setStatus('error')
      return
    }

    // Poll the user's profile until subscription_status flips to 'active'
    // (the webhook handler updates it asynchronously after Stripe fires the event)
    let attempts = 0
    const maxAttempts = 12 // ~12 seconds

    const poll = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setStatus('error'); return }

      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_status, plan_type')
        .eq('id', user.id)
        .single()

      if (profile?.subscription_status === 'active') {
        const labels: Record<string, string> = {
          monthly: 'Monthly Plan',
          annual: 'Annual Plan',
          three_year: '3-Year Plan',
        }
        setPlanLabel(labels[profile.plan_type] ?? 'Plan')
        setStatus('confirmed')
        return
      }

      attempts++
      if (attempts < maxAttempts) {
        setTimeout(poll, 1000)
      } else {
        // Webhook may be slightly delayed — show success anyway
        setStatus('confirmed')
      }
    }

    poll()
  }, [sessionId, supabase])

  if (status === 'loading') {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-5 px-4">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="text-muted-foreground text-sm">Confirming your subscription…</p>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-6 px-4 text-center">
        <p className="text-muted-foreground">Something went wrong confirming your subscription.</p>
        <Button asChild variant="outline">
          <Link href="/subscribe">Try again</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center px-4">
      <div className="w-full max-w-md flex flex-col items-center gap-8 text-center">

        {/* Icon */}
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-primary/20 blur-2xl scale-150" />
          <div className="relative flex size-24 items-center justify-center rounded-full bg-primary/10 border-2 border-primary/20">
            <CheckCircle2 className="size-12 text-primary" strokeWidth={1.5} />
          </div>
        </div>

        {/* Copy */}
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-primary uppercase tracking-widest">
            Welcome to Verbatim
          </p>
          <h1 className="text-3xl font-bold tracking-tight">
            You&apos;re all set!
          </h1>
          {planLabel && (
            <p className="text-muted-foreground">
              Your <strong>{planLabel}</strong> is now active.
            </p>
          )}
          {!planLabel && (
            <p className="text-muted-foreground">
              Your subscription is now active.
            </p>
          )}
        </div>

        {/* What's next */}
        <div className="w-full flex flex-col gap-3 rounded-xl border bg-muted/30 p-5 text-left">
          <p className="text-sm font-semibold">What to do next</p>
          <ul className="flex flex-col gap-2">
            {[
              'Create your first memorization set',
              'Split it into chunks and start encoding',
              'Run a practice session today',
            ].map((item) => (
              <li key={item} className="flex items-center gap-3 text-sm text-muted-foreground">
                <Zap className="size-4 shrink-0 text-primary" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* CTA */}
        <div className="flex flex-col gap-3 w-full">
          <Button size="lg" className="w-full gap-2" onClick={() => router.push('/')}>
            Go to my library
            <ArrowRight className="size-4" />
          </Button>
          <Button size="lg" variant="outline" className="w-full gap-2" onClick={() => router.push('/create')}>
            Create a set now
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Manage your subscription any time in{' '}
          <Link href="/account" className="underline underline-offset-4">
            Account Settings
          </Link>
          .
        </p>
      </div>
    </div>
  )
}

export default function BillingSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-svh items-center justify-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  )
}
