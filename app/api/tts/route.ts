import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ttsLimiter, applyRateLimit } from '@/lib/rate-limit'
import { z } from 'zod'

const ALLOWED_VOICES = [
  'Arista-PlayAI',
  'Fritz-PlayAI',
  'George-PlayAI',
  'Adelaide-PlayAI',
  'Atlas-PlayAI',
  'Clio-PlayAI',
] as const

const ttsSchema = z.object({
  text: z.string().min(1).max(4500),
  voice: z.enum(ALLOWED_VOICES),
})

/** POST /api/tts — generate AI speech via Groq PlayAI TTS, returns audio/mpeg */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const rateLimitResponse = await applyRateLimit(ttsLimiter, `tts:${user.id}`)
  if (rateLimitResponse) return rateLimitResponse

  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'TTS not configured' }, { status: 500 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = ttsSchema.safeParse(body)
  if (!parsed.success) {
    const msg = parsed.error.errors[0]?.message ?? 'Invalid request'
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  const { text, voice } = parsed.data

  const groqResponse = await fetch('https://api.groq.com/openai/v1/audio/speech', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'playai-tts',
      input: text,
      voice,
      response_format: 'mp3',
    }),
  })

  if (!groqResponse.ok) {
    const err = await groqResponse.text()
    console.error('[TTS] Groq error:', err)
    return NextResponse.json({ error: 'TTS generation failed. Please try again.' }, { status: 500 })
  }

  return new NextResponse(groqResponse.body, {
    headers: {
      'Content-Type': 'audio/mpeg',
      'Cache-Control': 'no-store',
    },
  })
}
