"use client"

import posthog from 'posthog-js'

// PostHog is initialized in components/posthog-provider.tsx at module level.
// These helpers wrap posthog calls with SSR guards and dev logging.

function isAnalyticsEnabled(): boolean {
  return typeof window !== 'undefined'
}

// ============================================================================
// USER IDENTIFICATION
// ============================================================================

/**
 * Identify user for analytics tracking
 * Call this after successful authentication
 * 
 * @param userId - Unique user identifier (from Supabase)
 * @param properties - User properties (email, role, etc.)
 */
export function identifyUser(userId: string, properties?: Record<string, any>): void {
  if (!isAnalyticsEnabled()) return

  try {
    posthog.identify(userId, {
      ...properties,
      $set_once: {
        signup_date: properties?.signup_date || new Date().toISOString(),
      },
    })
    console.log('[PostHog] 👤 User identified:', userId.slice(0, 8) + '...')
  } catch (error) {
    console.error('[PostHog] ❌ Failed to identify user:', error)
  }
}

/**
 * Reset user identity (call on logout)
 */
export function resetUser(): void {
  if (!isAnalyticsEnabled()) return

  try {
    posthog.reset()
    console.log('[PostHog] 🔓 User identity reset')
  } catch (error) {
    console.error('[PostHog] ❌ Failed to reset user:', error)
  }
}

/**
 * Update user properties without re-identifying
 * Use this to update counts, scores, etc.
 * 
 * @param properties - Properties to update
 */
export function updateUserProperties(properties: Record<string, any>): void {
  if (!isAnalyticsEnabled()) return
  
  try {
    posthog.people.set(properties)
  } catch (error) {
    console.error('[Analytics] Failed to update user properties:', error)
  }
}

// ============================================================================
// EVENT TRACKING
// ============================================================================

/**
 * Track a custom event
 * 
 * @param eventName - Name of the event (use constants from analytics-events.ts)
 * @param properties - Event properties
 */
export function trackEvent(eventName: string, properties?: Record<string, any>): void {
  if (!isAnalyticsEnabled()) return

  try {
    posthog.capture(eventName, {
      ...properties,
      timestamp: new Date().toISOString(),
    })
    console.log('[PostHog] 📊 Event captured:', eventName, properties ?? '')
  } catch (error) {
    console.error('[PostHog] ❌ Failed to capture event:', eventName, error)
  }
}

/**
 * Track page view
 * Call this manually on route changes
 * 
 * @param pagePath - The page path (e.g., '/memorization/123')
 * @param pageTitle - Optional page title
 */
export function trackPageView(pagePath?: string, pageTitle?: string): void {
  if (!isAnalyticsEnabled()) return
  
  try {
    const path = pagePath || window.location.pathname
    const title = pageTitle || document.title
    
    posthog.capture('$pageview', {
      $current_url: window.location.href,
      $pathname: path,
      $title: title,
    })
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[Analytics] Page view tracked:', path, title)
    }
  } catch (error) {
    console.error('[Analytics] Failed to track page view:', error)
  }
}

// ============================================================================
// FEATURE FLAGS
// ============================================================================

/**
 * Check if a feature flag is enabled
 * 
 * @param flagKey - Feature flag key in PostHog
 * @param defaultValue - Default value if flag not found
 * @returns boolean indicating if feature is enabled
 */
export function isFeatureEnabled(flagKey: string, defaultValue: boolean = false): boolean {
  if (!isAnalyticsEnabled()) return defaultValue
  
  try {
    return posthog.isFeatureEnabled(flagKey) ?? defaultValue
  } catch (error) {
    console.error('[Analytics] Failed to check feature flag:', error)
    return defaultValue
  }
}

/**
 * Get feature flag variant/value
 * Useful for A/B testing with multiple variants
 * 
 * @param flagKey - Feature flag key in PostHog
 * @returns The feature flag value or undefined
 */
export function getFeatureFlag(flagKey: string): string | boolean | undefined {
  if (!isAnalyticsEnabled()) return undefined
  
  try {
    return posthog.getFeatureFlag(flagKey)
  } catch (error) {
    console.error('[Analytics] Failed to get feature flag:', error)
    return undefined
  }
}

// ============================================================================
// RETENTION HELPERS
// ============================================================================

/**
 * Track daily active user
 * Should be called once per day per user session
 */
export function trackDailyActive(): void {
  if (!isAnalyticsEnabled()) return
  
  const today = new Date().toISOString().split('T')[0]
  const lastTracked = localStorage.getItem('analytics_daily_active')
  
  if (lastTracked !== today) {
    trackEvent('daily_active', { date: today })
    localStorage.setItem('analytics_daily_active', today)
  }
}

/**
 * Track weekly active user
 * Should be called once per week per user session
 */
export function trackWeeklyActive(): void {
  if (!isAnalyticsEnabled()) return
  
  const now = new Date()
  const weekNumber = getWeekNumber(now)
  const weekKey = `${now.getFullYear()}-W${weekNumber}`
  const lastTracked = localStorage.getItem('analytics_weekly_active')
  
  if (lastTracked !== weekKey) {
    trackEvent('weekly_active', { week: weekKey })
    localStorage.setItem('analytics_weekly_active', weekKey)
  }
}

/**
 * Track session start
 * Call this when app loads with authenticated user
 */
export function trackSessionStart(): void {
  trackEvent('session_started', {
    referrer: document.referrer || 'direct',
    user_agent: navigator.userAgent,
  })
  
  // Also track DAU and WAU
  trackDailyActive()
  trackWeeklyActive()
}

// ============================================================================
// ERROR TRACKING
// ============================================================================

/**
 * Track an error
 * Use this in catch blocks for better error monitoring
 * 
 * @param error - Error object or message
 * @param context - Additional context about where/when the error occurred
 */
export function trackError(error: Error | string, context?: Record<string, any>): void {
  if (!isAnalyticsEnabled()) return
  
  try {
    const errorMessage = typeof error === 'string' ? error : error.message
    const errorStack = typeof error === 'string' ? undefined : error.stack
    
    trackEvent('error_encountered', {
      error_message: errorMessage,
      error_type: typeof error === 'string' ? 'string' : error.name,
      stack_trace: errorStack,
      page: window.location.pathname,
      ...context,
    })
  } catch (trackingError) {
    console.error('[Analytics] Failed to track error:', trackingError)
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get ISO week number for a date
 */
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

/**
 * Sanitize properties to remove PII
 * Call this before tracking if properties might contain sensitive data
 */
export function sanitizeProperties(properties: Record<string, any>): Record<string, any> {
  const sanitized = { ...properties }
  
  // Remove common PII fields
  const piiFields = ['password', 'email', 'phone', 'ssn', 'credit_card']
  piiFields.forEach(field => {
    if (field in sanitized) {
      delete sanitized[field]
    }
  })
  
  return sanitized
}

// Export posthog instance for advanced usage
export { posthog }
