import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function parseChunks(content: string, mode: string): { order_index: number; text: string }[] {
  let texts: string[]
  const normalized = content.replace(/\r\n/g, '\n')
  switch (mode) {
    case 'line':
      texts = normalized.split('\n').map(l => l.trim()).filter(l => l.length > 0)
      break
    case 'sentence':
      texts = normalized.replace(/\n+/g, ' ').split(/(?<=[.!?])\s+/).map(s => s.trim()).filter(s => s.length > 0)
      break
    case 'custom':
      texts = normalized.split(/\/+/).map(c => c.trim()).filter(c => c.length > 0)
      break
    default:
      texts = normalized.split(/\n\s*\n+/).map(p => p.trim().replace(/\s+/g, ' ')).filter(p => p.length > 0)
  }
  if (texts.length === 0) texts = [content]
  return texts.map((text, index) => ({ order_index: index, text }))
}

interface RouteContext {
  params: Promise<{ token: string }>
}

export async function POST(_request: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  const { token } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Uses the authenticated user's session. Requires the public RLS policy:
  // "Public can read shared sets by share_token" (supabase-migration-sharing-policy.sql)
  const { data: sourceSet, error: fetchError } = await supabase
    .from('memorization_sets')
    .select('id, user_id, title, content, chunk_mode')
    .eq('share_token', token)
    .single()

  if (fetchError || !sourceSet) {
    return NextResponse.json({ error: 'Share link is no longer active' }, { status: 404 })
  }

  // If the user already owns this set, return their set ID directly
  if (sourceSet.user_id === user.id) {
    return NextResponse.json({ importedSetId: sourceSet.id, alreadyOwned: true })
  }

  const initialProgress = {
    familiarizeCompleted: false,
    encode: { stage1Completed: false, stage2Completed: false, stage3Completed: false, lastScore: null },
    tests: {
      firstLetter: { bestScore: null, lastScore: null },
      fullText: { bestScore: null, lastScore: null },
      audioTest: { bestScore: null, lastScore: null },
    },
  }

  const initialSessionState = {
    currentStep: null,
    currentChunkIndex: null,
    currentEncodeStage: null,
    lastVisitedAt: null,
  }

  const { data: newSet, error: insertError } = await supabase
    .from('memorization_sets')
    .insert({
      user_id: user.id,
      title: sourceSet.title,
      content: sourceSet.content,
      chunk_mode: sourceSet.chunk_mode,
      progress: initialProgress,
      session_state: initialSessionState,
      recommended_step: 'familiarize',
      created_from: 'text',
    })
    .select('id')
    .single()

  if (insertError || !newSet) {
    return NextResponse.json({ error: 'Failed to import set' }, { status: 500 })
  }

  const chunks = parseChunks(sourceSet.content, sourceSet.chunk_mode)
  const chunkRows = chunks.map(c => ({
    set_id: newSet.id,
    order_index: c.order_index,
    text: c.text,
  }))

  const { error: chunksError } = await supabase.from('chunks').insert(chunkRows)

  if (chunksError) {
    await supabase.from('memorization_sets').delete().eq('id', newSet.id)
    return NextResponse.json({ error: 'Failed to create chunks' }, { status: 500 })
  }

  return NextResponse.json({ importedSetId: newSet.id })
}
