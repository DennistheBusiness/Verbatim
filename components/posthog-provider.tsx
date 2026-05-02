'use client'

import posthog from 'posthog-js'
import { PostHogProvider as PHProvider, usePostHog } from 'posthog-js/react'
import { useEffect, Suspense } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

// Initialize at module level — runs synchronously when the module loads,
// avoiding hydration/useEffect timing issues in Next.js App Router.
if (typeof window !== 'undefined') {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    api_host: 'https://us.i.posthog.com', // direct — bypassing proxy for diagnostic
    defaults: '2026-01-30',
    capture_pageview: false,
    flush_interval_ms: 2000,
    loaded: (ph) => {
      console.log('[PostHog] ✅ Initialized — distinct_id:', ph.get_distinct_id())
      console.log('[PostHog] Config — api_host:', ph.config.api_host, '| key:', ph.config.token?.slice(0, 8) + '...')
      ph.debug() // temp: enabled in all envs to diagnose missing events
    },
  })
}

function PostHogPageView() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const ph = usePostHog()

  useEffect(() => {
    if (!pathname || !ph) return
    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '')
    ph.capture('$pageview', {
      $current_url: window.location.href,
      $pathname: url,
      $title: document.title,
    })
    if (process.env.NODE_ENV === 'development') {
      console.log('[PostHog] 📄 Pageview:', url)
    }
  }, [pathname, searchParams, ph])

  return null
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  return (
    <PHProvider client={posthog}>
      <Suspense fallback={null}>
        <PostHogPageView />
      </Suspense>
      {children}
    </PHProvider>
  )
}
