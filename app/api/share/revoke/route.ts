import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

  const { error } = await supabase
    .from('memorization_sets')
    .update({ share_token: null })
    .eq('id', setId)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: 'Failed to revoke share token' }, { status: 500 })

  return NextResponse.json({ success: true })
}
