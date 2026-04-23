"use client"

import { useEffect, Suspense } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { initializeAnalytics, trackPageView } from '@/lib/analytics'

/**
 * PostHog Page View Tracker
 * 
 * Separate component for tracking page views to isolate useSearchParams()
 * in a Suspense boundary (Next.js requirement for static generation).
 */
function PostHogPageView() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (pathname) {
      const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '')
      trackPageView(url)
    }
  }, [pathname, searchParams])

  return null
}

/**
 * PostHog Analytics Provider
 * 
 * Initializes PostHog and tracks page views on route changes.
 * Must be a client component to access window object and Next.js navigation hooks.
 */
export function PostHogProvider({ children }: { children: React.ReactNode }) {
  // Initialize PostHog on mount
  useEffect(() => {
    initializeAnalytics()
  }, [])

  return (
    <>
      <Suspense fallback={null}>
        <PostHogPageView />
      </Suspense>
      {children}
    </>
  )
}
