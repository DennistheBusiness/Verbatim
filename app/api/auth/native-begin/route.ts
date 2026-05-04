import { NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return new Response('Bad Request', { status: 400 })
  }

  const { nonce } = body as { nonce?: unknown }

  if (typeof nonce !== 'string' || nonce.length !== 36) {
    return new Response('Bad Request', { status: 400 })
  }

  const supabase = createServiceClient()

  // Clean up stale transfers (older than 10 minutes) opportunistically
  await supabase
    .from('native_auth_transfers')
    .delete()
    .lt('created_at', new Date(Date.now() - 10 * 60 * 1000).toISOString())

  const { error } = await supabase
    .from('native_auth_transfers')
    .insert({ nonce })

  if (error) {
    console.error('[native-begin] insert error:', error.code, error.message, error.details)
    return new Response(`Server Error: ${error.message}`, { status: 500 })
  }

  return new Response('OK', { status: 200 })
}
