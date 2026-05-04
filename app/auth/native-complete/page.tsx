'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

export default function NativeCompletePage() {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    const nonce = localStorage.getItem('native_auth_nonce')

    if (!nonce) {
      window.location.href = '/auth/login'
      return
    }

    fetch('/api/auth/native-transfer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nonce }),
    })
      .then((r) => {
        if (!r.ok) throw new Error('transfer failed')
        return r.json()
      })
      .then(async ({ code }: { code: string }) => {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        localStorage.removeItem('native_auth_nonce')
        if (error) {
          window.location.href = '/auth/login'
        } else {
          router.push('/')
        }
      })
      .catch(() => {
        window.location.href = '/auth/login'
      })
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="size-6 animate-spin text-muted-foreground" />
    </div>
  )
}
