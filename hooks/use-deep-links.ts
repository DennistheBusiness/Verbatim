'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export function useDeepLinks() {
  const router = useRouter()

  useEffect(() => {
    if (typeof window === 'undefined') return

    import('@capacitor/app')
      .then(({ App }) => {
        const handle = App.addListener('appUrlOpen', (event) => {
          // Close in-app browser (SFSafariViewController) opened for OAuth
          import('@capacitor/browser').then(({ Browser }) => Browser.close()).catch(() => {})

          // Normalise custom scheme → HTTPS (no-op if URL is already HTTPS)
          const normalized = event.url.startsWith('com.squaredthought.verbatim://')
            ? event.url.replace('com.squaredthought.verbatim://', 'https://verbatim.squaredthought.com/')
            : event.url

          const url = new URL(normalized)

          // OAuth callback: route through the server callback handler (which detects
          // native flows via the pre-registered state and stores the code), then on
          // to /auth/native-complete where WKWebView exchanges it with its own verifier.
          if (url.pathname === '/auth/callback') {
            window.location.href = url.pathname + url.search + url.hash
            return
          }

          router.push(url.pathname + url.search + url.hash)
        })

        return () => {
          handle.then((h) => h.remove())
        }
      })
      .catch(() => {})
  }, [router])
}
