'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function useDeepLinks() {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (typeof window === 'undefined') return

    import('@capacitor/app')
      .then(({ App }) => {
        const handle = App.addListener('appUrlOpen', async (event) => {
          // Close in-app browser (SFSafariViewController) if OAuth flow opened one
          import('@capacitor/browser').then(({ Browser }) => Browser.close()).catch(() => {})

          // Normalise custom scheme → HTTPS (no-op if already HTTPS)
          const normalized = event.url.startsWith('com.squaredthought.verbatim://')
            ? event.url.replace('com.squaredthought.verbatim://', 'https://verbatim.squaredthought.com/')
            : event.url

          const url = new URL(normalized)
          const code = url.searchParams.get('code')

          // OAuth PKCE callback: exchange the code client-side so the session is
          // established in the WebView's localStorage before we navigate away.
          // router.push('/auth/callback') would do a client-side navigation that
          // skips the server Route Handler and leaves the code un-exchanged.
          if (url.pathname === '/auth/callback' && code) {
            const { error } = await supabase.auth.exchangeCodeForSession(code)
            router.push(error ? '/auth/login' : '/')
            return
          }

          router.push(url.pathname + url.search + url.hash)
        })

        return () => {
          handle.then((h) => h.remove())
        }
      })
      .catch(() => {})
  }, [router, supabase])
}
