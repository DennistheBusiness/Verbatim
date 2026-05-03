'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { identifyUser, resetUser } from '@/lib/analytics'

/**
 * SessionHandler component
 * 
 * Monitors user session and handles expiration/auth state changes.
 * - Redirects to login when session expires
 * - Handles auth state changes
 * - Shows toast notifications for session issues
 */
export function SessionHandler() {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    // Marketing site — no auth redirects, ever
    if (
      typeof window !== 'undefined' &&
      (window.location.hostname === 'squaredthought.com' ||
        window.location.hostname === 'www.squaredthought.com')
    ) {
      return
    }

    // Check initial session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      // If no session and not on public pages, redirect to login
      const publicPaths = ['/auth/login', '/auth/signup', '/auth/forgot-password', '/auth/reset-password', '/auth/callback', '/landing', '/share/']
      const isPublicPath = publicPaths.some(path => pathname.startsWith(path))
      
      if (!session && !isPublicPath) {
        toast.error('Your session has expired. Please sign in again.')
        router.push('/auth/login')
      }
    }

    checkSession()

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔐 Auth state changed:', event)

      switch (event) {
        case 'SIGNED_OUT':
          resetUser()
          if (pathname !== '/auth/login') {
            toast.info('You have been signed out')
          }
          router.push('/auth/login')
          break

        case 'TOKEN_REFRESHED':
          break

        case 'USER_UPDATED':
          break

        case 'PASSWORD_RECOVERY':
          router.push('/auth/reset-password')
          break

        case 'SIGNED_IN':
          // Covers Google OAuth — email login identifies in the login page handler
          if (session?.user) {
            identifyUser(session.user.id, { email: session.user.email ?? undefined })
          }
          if (pathname.startsWith('/auth/') && pathname !== '/auth/reset-password') {
            router.push('/')
          }
          break
      }
    })

    // Set up session refresh interval (every 20 minutes)
    const refreshInterval = setInterval(async () => {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('❌ Session check error:', error)
        toast.error('Session expired. Please sign in again.')
        router.push('/auth/login')
      } else if (!session && !pathname.startsWith('/auth/') && !pathname.startsWith('/landing') && !pathname.startsWith('/share/')) {
        toast.error('Your session has expired. Please sign in again.')
        router.push('/auth/login')
      }
    }, 20 * 60 * 1000) // 20 minutes

    return () => {
      subscription.unsubscribe()
      clearInterval(refreshInterval)
    }
  }, [supabase, router, pathname])

  return null // This is a utility component with no UI
}
