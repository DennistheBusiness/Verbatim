"use client"

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { initializeAnalytics, trackPageView } from '@/lib/analytics'

/**
 * PostHog Analytics Provider
 * 
 * Initializes PostHog and tracks page views on route changes.
 * Must be a client component to access window object and Next.js navigation hooks.
 */
export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Initialize PostHog on mount
  useEffect(() => {
    initializeAnalytics()
  }, [])

  // Track page views on route change
  useEffect(() => {
    if (pathname) {
      const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '')
      trackPageView(url)
    }
  }, [pathname, searchParams])

  return <>{children}</>
}
