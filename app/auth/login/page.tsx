'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { trackEvent, identifyUser } from '@/lib/analytics'
import { USER_LOGGED_IN } from '@/lib/analytics-events'

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  )
}

function LoginContent() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const searchParams = useSearchParams()
  const importShare = searchParams.get('importShare')
  const supabase = createClient()

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) { toast.error(error.message) }
      else {
        if (data.user) identifyUser(data.user.id, { email: data.user.email })
        trackEvent(USER_LOGGED_IN, { method: 'email' })
        sessionStorage.removeItem("verbatim-splash-seen")
        window.location.href = importShare ? `/share/${importShare}` : '/'
      }
    } catch {
      toast.error('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setLoading(true)
    try {
      if (importShare) {
        document.cookie = `pendingShare=${importShare}; path=/; max-age=600; SameSite=Lax`
      }

      const isNative = typeof window !== 'undefined' && !!(window as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.()

      if (isNative) {
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: 'https://verbatim.squaredthought.com/auth/callback',
            skipBrowserRedirect: true,
            queryParams: { prompt: 'select_account' },
          },
        })
        if (error) { toast.error(error.message); setLoading(false); return }
        if (data.url) {
          const { Browser } = await import('@capacitor/browser')

          // When the in-app browser closes — either because a Universal Link
          // intercepted the callback and appUrlOpen called Browser.close(), or
          // because the user tapped Done — check for a session.
          // SFSafariViewController and WKWebView share the same cookie store
          // (iOS 11+), so if the /auth/callback server route ran inside the
          // browser it will have set the session cookie already.
          const listener = await Browser.addListener('browserFinished', async () => {
            listener.remove()
            setLoading(false)
            // If appUrlOpen already navigated to /auth/callback, don't double-navigate
            if (window.location.pathname === '/auth/callback') return
            // Hard navigate to / — server middleware checks the session cookie
            // and either shows the home page or redirects back to login
            window.location.href = '/'
          })

          await Browser.open({ url: data.url, windowName: '_self' })
          setLoading(false) // clear spinner once browser is open
        }
      } else {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo: `${window.location.origin}/auth/callback` },
        })
        if (error) { toast.error(error.message); setLoading(false) }
      }
    } catch {
      toast.error('An unexpected error occurred')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">

      {/* Left panel — branding (desktop only) */}
      <div className="hidden lg:flex lg:w-[45%] relative flex-col items-center justify-center p-14 overflow-hidden bg-[oklch(0.15_0.05_240)]">
        <div className="absolute top-[-15%] left-[-10%] w-[70%] aspect-square rounded-full bg-[oklch(0.55_0.22_240)]/25 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[55%] aspect-square rounded-full bg-[oklch(0.65_0.20_150)]/20 blur-[90px] pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center gap-4 max-w-sm">
          <Image
            src="/verbatim-logo-icon.png"
            alt="Verbatim"
            width={180}
            height={180}
            className="drop-shadow-2xl -mb-6"
            style={{ width: 180, height: 180 }}
          />
          <div className="flex flex-col gap-2">
            <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-[oklch(0.78_0.18_240)] to-[oklch(0.84_0.18_150)] bg-clip-text text-transparent">
              Verbatim
            </h1>
            <p className="text-base text-white/55 leading-relaxed">
              Master any text.<br />Word for word.
            </p>
          </div>
          <div className="flex flex-col gap-2.5 w-full">
            {['Progressive first-letter encoding', 'AI-powered transcription & OCR', 'Spaced repetition scheduling'].map((f) => (
              <div key={f} className="flex items-center gap-3 bg-white/[0.06] border border-white/[0.08] rounded-xl px-4 py-3 text-left">
                <div className="size-1.5 rounded-full bg-[oklch(0.75_0.18_240)] shrink-0 mt-px" />
                <span className="text-sm text-white/65">{f}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="absolute bottom-8 text-xs text-white/25">by Squared Thought</p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col items-center justify-center overflow-y-auto min-h-screen lg:min-h-0 px-6 py-12 sm:px-10">

        {/* Mobile branding */}
        <div className="flex lg:hidden flex-col items-center gap-1.5 mb-10">
          <Image
            src="/verbatim-logo-icon.png"
            alt="Verbatim"
            width={160}
            height={160}
            className="-mb-5"
            style={{ width: 160, height: 160 }}
          />
          <span className="text-2xl font-bold tracking-tight bg-gradient-to-r from-[oklch(0.55_0.22_240)] to-[oklch(0.65_0.20_150)] bg-clip-text text-transparent">
            Verbatim
          </span>
          <span className="text-xs text-muted-foreground -mt-0.5">by Squared Thought</span>
        </div>

        <div className="w-full max-w-[360px] flex flex-col gap-7">

          <div className="flex flex-col gap-1.5">
            <h2 className="text-[28px] font-bold tracking-tight leading-tight">Welcome back</h2>
            <p className="text-[15px] text-muted-foreground">Sign in to continue your practice</p>
          </div>

          <form onSubmit={handleEmailLogin} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email" className="text-[14px] font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="h-12 text-[15px]"
              />
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-[14px] font-medium">Password</Label>
                <Link href="/auth/forgot-password" className="text-[13px] text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="h-12 text-[15px]"
              />
            </div>

            <Button type="submit" size="lg" className="w-full h-12 text-[15px] font-semibold mt-1" disabled={loading}>
              {loading ? <><Loader2 className="mr-2 size-4 animate-spin" />Signing in…</> : 'Sign in'}
            </Button>
          </form>

          <div className="flex items-center gap-3">
            <div className="flex-1 border-t" />
            <span className="text-xs text-muted-foreground uppercase tracking-widest">or</span>
            <div className="flex-1 border-t" />
          </div>

          {/* Google */}
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full gap-3 h-12 text-[15px] font-medium"
            onClick={handleGoogleLogin}
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

          <p className="text-[14px] text-muted-foreground text-center">
            Don&apos;t have an account?{' '}
            <Link href="/auth/signup" className="text-primary font-semibold hover:underline">
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
