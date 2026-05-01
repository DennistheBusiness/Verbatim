'use client'

import posthog from 'posthog-js'
import { PostHogProvider as PHProvider, usePostHog } from 'posthog-js/react'
import { useEffect, Suspense } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

// Initialize at module level — runs synchronously when the module loads,
// avoiding hydration/useEffect timing issues in Next.js App Router.
if (typeof window !== 'undefined') {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    api_host: '/ingest',
    ui_host: 'https://us.posthog.com',
    person_profiles: 'always',
    capture_pageview: false,
    capture_pageleave: true,
    autocapture: false,
    disable_session_recording: true,
    disable_persistence: false,
    advanced_disable_feature_flags: true,
    advanced_disable_feature_flags_on_first_load: true,
    disable_surveys: true,
    loaded: (ph) => {
      console.log('[PostHog] ✅ Initialized — distinct_id:', ph.get_distinct_id())
      console.log('[PostHog] Config — api_host:', ph.config.api_host, '| key:', ph.config.token?.slice(0, 8) + '...')
      if (process.env.NODE_ENV === 'development') {
        ph.debug()
      }
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
