'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export function useDeepLinks() {
  const router = useRouter()

  useEffect(() => {
    if (typeof window === 'undefined') return

    import('@capacitor/app')
      .then(({ App }) => {
        const handle = App.addListener('appUrlOpen', async (event) => {
          // Close in-app browser (SFSafariViewController) if OAuth flow opened one
          import('@capacitor/browser').then(({ Browser }) => Browser.close()).catch(() => {})
          const normalized = event.url.replace(
            'com.squaredthought.verbatim://',
            'https://verbatim.squaredthought.com/'
          )
          const url = new URL(normalized)
          router.push(url.pathname + url.search + url.hash)
        })
        return () => {
          handle.then((h) => h.remove())
        }
      })
      .catch(() => {})
  }, [router])
}
