import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let setId: string
  try {
    const body = await request.json()
    setId = body.setId
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!setId) return NextResponse.json({ error: 'setId required' }, { status: 400 })

  const { data: set, error } = await supabase
    .from('memorization_sets')
    .select('id, share_token, title')
    .eq('id', setId)
    .eq('user_id', user.id)
    .single()

  if (error || !set) return NextResponse.json({ error: 'Set not found' }, { status: 404 })

  if (set.share_token) {
    const origin = new URL(request.url).origin
    return NextResponse.json({ token: set.share_token, url: `${origin}/share/${set.share_token}` })
  }

  const token = crypto.randomBytes(8).toString('base64url').slice(0, 12)

  const { error: updateError } = await supabase
    .from('memorization_sets')
    .update({ share_token: token })
    .eq('id', setId)
    .eq('user_id', user.id)

  if (updateError) return NextResponse.json({ error: 'Failed to generate share token' }, { status: 500 })

  const origin = new URL(request.url).origin
  return NextResponse.json({ token, url: `${origin}/share/${token}` })
}
