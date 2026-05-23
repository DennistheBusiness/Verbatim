'use client'

import { Suspense, useState, useRef, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { trackEvent, identifyUser } from '@/lib/analytics'
import { USER_SIGNED_UP } from '@/lib/analytics-events'

async function sha256hex(message: string): Promise<string> {
  const data = new TextEncoder().encode(message)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('')
}

export default function SignupPage() {
  return (
    <Suspense>
      <SignupContent />
    </Suspense>
  )
}

function SignupContent() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [isIos, setIsIos] = useState(false)
  const turnstileRef = useRef<TurnstileInstance>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const importShare = searchParams.get('importShare')
  const supabase = createClient()

  useEffect(() => {
    const cap = (window as any).Capacitor
    if (cap?.isNativePlatform?.() && cap.getPlatform?.() === 'ios') setIsIos(true)
  }, [])

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) { toast.error('Passwords do not match'); return }
    if (password.length < 8) { toast.error('Password must be at least 8 characters'); return }
    if (!captchaToken) { toast.error('Please complete the security check'); return }
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName }, captchaToken: captchaToken ?? undefined },
      })
      if (error) {
        toast.error(error.message)
        turnstileRef.current?.reset()
        setCaptchaToken(null)
      } else if (data.session) {
        if (data.user) {
          identifyUser(data.user.id, { email: data.user.email, signup_date: data.user.created_at })
          trackEvent(USER_SIGNED_UP, { method: 'email' })
        }
        toast.success('Account created!')
        router.push(importShare ? `/onboarding?importShare=${importShare}` : '/onboarding')
      } else {
        if (data.user) {
          trackEvent(USER_SIGNED_UP, { method: 'email' })
        }
        toast.success('Account created! Please check your email to confirm.')
        router.push('/auth/login')
      }
    } catch {
      toast.error('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignup = async () => {
    setLoading(true)
    try {
      if (importShare) {
        document.cookie = `pendingShare=${importShare}; path=/; max-age=600; SameSite=Lax`
      }
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      })
      if (error) { toast.error(error.message); setLoading(false) }
    } catch {
      toast.error('An unexpected error occurred')
      setLoading(false)
    }
  }

  const handleAppleSignup = async () => {
    setLoading(true)
    try {
      if (importShare) {
        document.cookie = `pendingShare=${importShare}; path=/; max-age=600; SameSite=Lax`
      }

      const isNative = typeof window !== 'undefined' && !!(window as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.()

      if (isNative) {
        const rawNonce = Array.from(crypto.getRandomValues(new Uint8Array(32)))
          .map(b => b.toString(16).padStart(2, '0')).join('')
        const hashedNonce = await sha256hex(rawNonce)

        const { SignInWithApple } = await import('@capacitor-community/apple-sign-in')
        const result = await SignInWithApple.authorize({
          clientId: 'com.squaredthought.verbatim',
          redirectURI: 'https://verbatim.squaredthought.com/auth/callback',
          scopes: 'email name',
          nonce: hashedNonce,
        })

        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: 'apple',
          token: result.response.identityToken,
          nonce: rawNonce,
        })
        if (error) { toast.error(error.message); return }
        if (data.user) {
          identifyUser(data.user.id, { email: data.user.email ?? result.response.email ?? undefined })
          trackEvent(USER_SIGNED_UP, { method: 'apple' })
        }
        router.push(importShare ? `/onboarding?importShare=${importShare}` : '/onboarding')
      } else {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'apple',
          options: { redirectTo: `${window.location.origin}/auth/callback` },
        })
        if (error) { toast.error(error.message) }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      if (!msg.includes('1001')) toast.error('Sign in with Apple failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">

      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col items-center justify-center p-12 overflow-hidden bg-[oklch(0.18_0.04_240)]">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] aspect-square rounded-full bg-[oklch(0.55_0.22_240)]/20 blur-[80px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[50%] aspect-square rounded-full bg-[oklch(0.65_0.20_150)]/20 blur-[80px] pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center gap-8 max-w-sm">
          <Image src="/verbatim-logo-icon.png" alt="Verbatim" width={180} height={180} className="drop-shadow-2xl -mb-6" style={{ width: 180, height: 180 }} />
          <div className="flex flex-col gap-3">
            <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-[oklch(0.75_0.18_240)] to-[oklch(0.82_0.16_150)] bg-clip-text text-transparent">
              Verbatim
            </h1>
            <p className="text-lg text-white/60 leading-relaxed">
              Master any text. Word for word.
            </p>
          </div>
          <div className="flex flex-col gap-2 w-full">
            {[
              'Progressive first-letter encoding',
              'AI-powered transcription & OCR',
              'Spaced repetition scheduling',
            ].map((f) => (
              <div key={f} className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                <div className="size-1.5 rounded-full bg-[oklch(0.75_0.18_240)] shrink-0" />
                <span className="text-sm text-white/70">{f}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="absolute bottom-8 text-xs text-white/30">by Squared Thought</p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col items-center justify-start pt-10 p-6 sm:p-12 overflow-y-auto">
        {/* Mobile branding */}
        <div className="flex lg:hidden flex-col items-center gap-2 mb-10">
          <Image src="/verbatim-logo-icon.png" alt="Verbatim" width={160} height={160} className="-mb-5" style={{ width: 160, height: 160 }} />
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-[oklch(0.55_0.22_240)] to-[oklch(0.65_0.20_150)] bg-clip-text text-transparent">
            Verbatim
          </h1>
          <span className="text-xs text-muted-foreground">by Squared Thought</span>
        </div>

        <div className="w-full max-w-sm flex flex-col gap-8">
          <div className="flex flex-col gap-1">
            <h2 className="text-3xl font-bold tracking-tight">Create account</h2>
            <p className="text-muted-foreground">Start memorizing in minutes</p>
          </div>

          {/* Google */}
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full gap-3 h-12 text-sm font-medium"
            onClick={handleGoogleSignup}
            disabled={loading}
          >
            <svg className="size-5 shrink-0" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Continue with Google
          </Button>

          {/* Apple — iOS only */}
          {isIos && (
          <Button
            type="button"
            size="lg"
            className="w-full gap-3 h-12 text-sm font-medium bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90"
            onClick={handleAppleSignup}
            disabled={loading}
          >
            <svg className="size-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
            </svg>
            Continue with Apple
          </Button>
          )}

          <div className="relative flex items-center gap-3">
            <div className="flex-1 border-t" />
            <span className="text-xs text-muted-foreground uppercase tracking-widest">or</span>
            <div className="flex-1 border-t" />
          </div>

          <form onSubmit={handleEmailSignup} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="fullName">Full Name <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input id="fullName" type="text" placeholder="Your name" value={fullName} onChange={(e) => setFullName(e.target.value)} disabled={loading} className="h-11" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={loading} className="h-11" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="Min. 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={loading} className="h-11" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input id="confirmPassword" type="password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required disabled={loading} className="h-11" />
            </div>
            <Turnstile
              ref={turnstileRef}
              siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
              onSuccess={setCaptchaToken}
              onExpire={() => { turnstileRef.current?.reset(); setCaptchaToken(null) }}
              onError={() => { turnstileRef.current?.reset(); setCaptchaToken(null) }}
              options={{ theme: 'auto', size: 'flexible' }}
            />
            <Button type="submit" size="lg" className="w-full h-12 text-sm font-semibold mt-1" disabled={loading || !captchaToken}>
              {loading ? (
                <><Loader2 className="mr-2 size-4 animate-spin" />Creating account…</>
              ) : (
                'Create account'
              )}
            </Button>
          </form>

          <p className="text-sm text-muted-foreground text-center">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-primary font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
        {/* Keyboard scroll spacer — keeps password field visible when virtual keyboard opens */}
        <div className="h-[50vh] w-full shrink-0" aria-hidden="true" />
      </div>
    </div>
  )
}
