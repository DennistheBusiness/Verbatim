'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check, Zap, Star, ChevronRight, Tag, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

const PLANS = [
  {
    id: 'monthly',
    name: 'Monthly',
    price: '$7',
    period: '/month',
    description: 'Full access, billed monthly. Cancel any time.',
    badge: null,
    highlighted: false,
  },
  {
    id: 'annual',
    name: 'Annual',
    price: '$5',
    period: '/month',
    billedAs: 'Billed $60/year',
    description: 'Best value. Full access for the whole year.',
    badge: 'Most Popular',
    highlighted: true,
  },
  {
    id: 'three_year',
    name: '3-Year',
    price: '$100',
    period: ' once',
    billedAs: 'One payment, 3 years of access',
    description: 'Pay once and lock in your access for three years.',
    badge: 'Best Deal',
    highlighted: false,
  },
] as const

const FEATURES = [
  'Unlimited memorization sets',
  'First-letter encoding practice',
  'Audio recall & recording',
  'Spaced repetition scheduling',
  'Flashcard test mode',
  'Progress tracking & analytics',
  'AI transcription & OCR',
  'Share sets with anyone',
]

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null)
  const [promoCode, setPromoCode] = useState('')
  const [promoOpen, setPromoOpen] = useState(false)
  const [promoError, setPromoError] = useState<string | null>(null)
  const [promoApplied, setPromoApplied] = useState(false)

  const handleSubscribe = async (planId: string) => {
    setLoading(planId)
    setPromoError(null)
    try {
      const res = await fetch('/api/billing/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, promoCode: promoApplied ? promoCode.trim() : undefined }),
      })
      const { url, error } = await res.json()
      if (error) {
        if (error.toLowerCase().includes('promo')) {
          setPromoError(error)
          setPromoApplied(false)
        } else {
          console.error('Checkout error:', error)
        }
        return
      }
      window.location.href = url
    } catch (err) {
      console.error('Checkout error:', err)
    } finally {
      setLoading(null)
    }
  }

  const handleApplyPromo = () => {
    if (!promoCode.trim()) return
    setPromoApplied(true)
    setPromoError(null)
  }

  return (
    <div className="flex min-h-svh flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b">
        <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
          ← Back to app
        </Link>
      </header>

      <main className="flex flex-1 flex-col items-center gap-12 px-4 py-12 pb-20">
        {/* Hero */}
        <div className="text-center flex flex-col gap-3 max-w-xl">
          <Badge variant="outline" className="mx-auto w-fit">Plans & Pricing</Badge>
          <h1 className="text-4xl font-bold tracking-tight">
            Simple pricing, every feature included
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            No feature tiers. No seat limits. Every plan includes everything Verbatim offers.
          </p>
        </div>

        {/* Plans */}
        <div className="grid gap-6 w-full max-w-4xl sm:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={cn(
                'flex flex-col gap-5 rounded-2xl border p-6',
                plan.highlighted
                  ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                  : 'bg-card'
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  {plan.name}
                </span>
                {plan.badge && (
                  <Badge className={plan.highlighted ? 'bg-primary text-primary-foreground' : ''}>
                    {plan.badge}
                  </Badge>
                )}
              </div>

              <div>
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground text-sm mb-1">{plan.period}</span>
                </div>
                {'billedAs' in plan && plan.billedAs && (
                  <p className="text-xs text-muted-foreground mt-1">{plan.billedAs}</p>
                )}
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed">{plan.description}</p>

              <Button
                className="w-full gap-2"
                variant={plan.highlighted ? 'default' : 'outline'}
                disabled={loading !== null}
                onClick={() => handleSubscribe(plan.id)}
              >
                {loading === plan.id ? 'Redirecting…' : 'Get started'}
                <ChevronRight className="size-4" />
              </Button>
            </div>
          ))}
        </div>

        {/* Promo code */}
        <div className="w-full max-w-md">
          {!promoOpen ? (
            <button
              onClick={() => setPromoOpen(true)}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mx-auto"
            >
              <Tag className="size-3.5" />
              Have a promo code?
            </button>
          ) : (
            <div className="rounded-xl border bg-card p-4 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Promo code</span>
                <button onClick={() => { setPromoOpen(false); setPromoCode(''); setPromoApplied(false); setPromoError(null) }}>
                  <X className="size-4 text-muted-foreground hover:text-foreground" />
                </button>
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g. INTERNAL357"
                  value={promoCode}
                  onChange={(e) => { setPromoCode(e.target.value.toUpperCase()); setPromoApplied(false); setPromoError(null) }}
                  className="font-mono uppercase"
                  onKeyDown={(e) => e.key === 'Enter' && handleApplyPromo()}
                />
                <Button variant="outline" onClick={handleApplyPromo} disabled={!promoCode.trim()}>
                  Apply
                </Button>
              </div>
              {promoApplied && !promoError && (
                <p className="text-xs text-green-600 font-medium">✓ Code applied — discount shown at checkout</p>
              )}
              {promoError && (
                <p className="text-xs text-destructive">{promoError}</p>
              )}
            </div>
          )}
        </div>

        {/* Feature list */}
        <div className="w-full max-w-md">
          <h2 className="text-center text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-6">
            Every plan includes
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-3 text-sm">
                <Check className="size-4 shrink-0 text-primary" />
                {f}
              </li>
            ))}
          </ul>
        </div>

        {/* Trial note */}
        <div className="rounded-xl border bg-muted/30 p-5 max-w-md w-full text-center">
          <div className="flex justify-center mb-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
              <Zap className="size-5 text-primary" />
            </div>
          </div>
          <p className="text-sm font-medium mb-1">7-day free trial</p>
          <p className="text-sm text-muted-foreground">
            All new accounts start with a 7-day free trial. No credit card required to sign up.
          </p>
        </div>

        {/* Student note */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Star className="size-4" />
          <span>Student? Your institution may provide access codes via your instructor.</span>
        </div>
      </main>
    </div>
  )
}
