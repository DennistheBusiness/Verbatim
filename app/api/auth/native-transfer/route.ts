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

  const { data, error } = await supabase
    .from('native_auth_transfers')
    .select('code')
    .eq('nonce', nonce)
    .not('code', 'is', null)
    .gt('created_at', new Date(Date.now() - 10 * 60 * 1000).toISOString())
    .single()

  if (error || !data?.code) {
    return new Response('Not Found', { status: 404 })
  }

  // Single-use: delete the record immediately
  await supabase.from('native_auth_transfers').delete().eq('nonce', nonce)

  return Response.json({ code: data.code })
}
