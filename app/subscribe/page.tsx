'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, Loader2, Zap, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import type { PurchasesPackage } from '@revenuecat/purchases-capacitor'
import { initCapacitorPlugins } from '@/lib/capacitor'

type ViewState = 'loading' | 'ready' | 'purchasing' | 'restoring' | 'error'

export default function SubscribePage() {
  const router = useRouter()
  const [isNative, setIsNative] = useState<boolean | null>(null)

  // Detect platform on mount, redirect web users to pricing
  useEffect(() => {
    async function detect() {
      const { Capacitor } = await import('@capacitor/core')
      if (!Capacitor.isNativePlatform()) {
        router.replace('/pricing')
        return
      }
      setIsNative(true)
    }
    detect()
  }, [router])

  if (isNative === null) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return <NativeSubscribeScreen />
}

function NativeSubscribeScreen() {
  const router = useRouter()
  const [viewState, setViewState] = useState<ViewState>('loading')
  const [packages, setPackages] = useState<PurchasesPackage[]>([])

  useEffect(() => {
    async function loadOfferings() {
      try {
        // Ensure RC is initialized (session-handler runs it at startup, but guard here
        // for direct navigation to /subscribe before session-handler has mounted)
        await initCapacitorPlugins()
        const { Purchases } = await import('@revenuecat/purchases-capacitor')
        // Small delay so any in-flight configure() call from session-handler settles
        await new Promise(resolve => setTimeout(resolve, 300))
        const offerings = await Purchases.getOfferings()
        const pkgs = offerings.current?.availablePackages ?? []
        setPackages(pkgs)
        setViewState(pkgs.length > 0 ? 'ready' : 'error')
      } catch (err) {
        console.error('Failed to load offerings:', err)
        setViewState('error')
      }
    }
    loadOfferings()
  }, [])

  async function syncToDatabase(productId?: string, expirationDate?: string | null) {
    try {
      await fetch('/api/billing/revenuecat-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, expirationDate }),
      })
    } catch (err) {
      console.error('[subscribe] revenuecat-sync failed', err)
    }
  }

  async function handlePurchase(pkg: PurchasesPackage) {
    setViewState('purchasing')
    try {
      const { Purchases } = await import('@revenuecat/purchases-capacitor')
      const { customerInfo } = await Purchases.purchasePackage({ aPackage: pkg })
      await syncToDatabase(pkg.product.identifier, customerInfo.latestExpirationDate)
      sessionStorage.setItem('billingBannerDismissed', '1')
      toast.success('Subscription activated!')
      router.replace('/')
    } catch (err: unknown) {
      // User cancelled is not an error
      const msg = err instanceof Error ? err.message : String(err)
      if (!msg.includes('userCancelled') && !msg.includes('1')) {
        toast.error('Purchase failed. Please try again.')
      }
      setViewState('ready')
    }
  }

  async function handleRestore() {
    setViewState('restoring')
    try {
      const { Purchases } = await import('@revenuecat/purchases-capacitor')
      const { customerInfo } = await Purchases.restorePurchases()
      if ('pro' in customerInfo.entitlements.active) {
        const activeEntitlement = customerInfo.entitlements.active['pro']
        await syncToDatabase(activeEntitlement?.productIdentifier, customerInfo.latestExpirationDate)
        sessionStorage.setItem('billingBannerDismissed', '1')
        toast.success('Purchases restored!')
        router.replace('/')
      } else {
        toast.info('No active subscription found.')
        setViewState('ready')
      }
    } catch {
      toast.error('Restore failed. Please try again.')
      setViewState('ready')
    }
  }

  const isBusy = viewState === 'purchasing' || viewState === 'restoring'

  // Sort: annual first, then monthly
  const sorted = [...packages].sort((a, b) => {
    const rank = (id: string) => id.includes('annual') ? 0 : 1
    return rank(a.identifier) - rank(b.identifier)
  })

  return (
    <div className="flex min-h-svh flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm flex flex-col gap-8">

        {/* Header */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
            <Zap className="size-8 text-primary" strokeWidth={1.5} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Verbatim Premium</h1>
          <p className="text-sm text-muted-foreground">
            Memorize anything. Unlock full access to all learning modes.
          </p>
        </div>

        {/* Feature list */}
        <ul className="flex flex-col gap-2">
          {[
            'Unlimited memorization sets',
            'All encoding methods',
            'Audio record & playback',
            'First Letter Recall tests',
            'Spaced repetition scheduling',
          ].map((item) => (
            <li key={item} className="flex items-center gap-3 text-sm">
              <CheckCircle2 className="size-4 shrink-0 text-primary" />
              {item}
            </li>
          ))}
        </ul>

        {/* Packages */}
        {viewState === 'loading' && (
          <div className="flex justify-center py-4">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {viewState === 'error' && (
          <p className="text-center text-sm text-destructive">
            Unable to load plans. Check your connection and try again.
          </p>
        )}

        {(viewState === 'ready' || isBusy) && sorted.map((pkg) => {
          const isAnnual = pkg.identifier.includes('annual')
          return (
            <Card
              key={pkg.identifier}
              className={isAnnual ? 'border-primary/40 bg-primary/5' : undefined}
            >
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">
                      {isAnnual ? 'Annual' : 'Monthly'}
                    </span>
                    {isAnnual && (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        Best value
                      </span>
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {pkg.product.priceString}{isAnnual ? '/year' : '/month'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {isAnnual ? 'Billed every 12 months' : 'Billed every month'}
                  </span>
                </div>
                <Button
                  size="sm"
                  variant={isAnnual ? 'default' : 'outline'}
                  disabled={isBusy}
                  onClick={() => handlePurchase(pkg)}
                >
                  {viewState === 'purchasing' ? <Loader2 className="size-4 animate-spin" /> : 'Subscribe'}
                </Button>
              </CardContent>
            </Card>
          )
        })}

        {/* Restore + legal */}
        <div className="flex flex-col items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            disabled={isBusy}
            onClick={handleRestore}
            className="gap-2 text-muted-foreground"
          >
            {viewState === 'restoring'
              ? <Loader2 className="size-4 animate-spin" />
              : <RefreshCw className="size-4" />}
            Restore Purchases
          </Button>
          <p className="text-center text-xs text-muted-foreground px-4">
            Payment will be charged to your Apple ID account at confirmation of purchase.
            Subscriptions automatically renew unless canceled at least 24 hours before the end of the current period.
          </p>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <Link href="/privacy" className="underline underline-offset-2">
              Privacy Policy
            </Link>
            <Link href="/terms" className="underline underline-offset-2">
              Terms of Use
            </Link>
          </div>
        </div>

      </div>
    </div>
  )
}
