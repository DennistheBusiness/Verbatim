'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

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
    // Check initial session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      // If no session and not on public pages, redirect to login
      const publicPaths = ['/auth/login', '/auth/signup', '/auth/forgot-password', '/auth/reset-password', '/auth/callback', '/landing']
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
          // Only show toast if user was previously signed in
          if (pathname !== '/auth/login') {
            toast.info('You have been signed out')
          }
          router.push('/auth/login')
          break

        case 'TOKEN_REFRESHED':
          console.log('✅ Session token refreshed')
          break

        case 'USER_UPDATED':
          console.log('👤 User profile updated')
          break

        case 'PASSWORD_RECOVERY':
          console.log('🔑 Password recovery initiated')
          // Redirect to reset password page when user clicks email link
          router.push('/auth/reset-password')
          break

        case 'SIGNED_IN':
          console.log('✅ User signed in')
          // Redirect to home after login, but keep user on reset-password page
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
      } else if (!session && !pathname.startsWith('/auth/') && !pathname.startsWith('/landing')) {
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
