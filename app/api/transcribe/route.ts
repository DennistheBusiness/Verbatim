import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { transcribeLimiter, applyRateLimit } from '@/lib/rate-limit'

export type TranscriptWord = { word: string; start: number; end: number }

export interface TranscribeResponse {
  text: string
  words: TranscriptWord[]
  error?: string
}

export async function POST(request: NextRequest): Promise<NextResponse<TranscribeResponse>> {
  // Require authenticated session
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ text: '', words: [], error: 'Unauthorized' }, { status: 401 })
  }

  // Rate limit: 20 transcriptions per user per hour
  const rateLimitResponse = await applyRateLimit(transcribeLimiter, `transcribe:${user.id}`)
  if (rateLimitResponse) {
    return NextResponse.json({ text: '', words: [], error: 'Too many requests. Please try again later.' }, { status: 429 })
  }

  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    return NextResponse.json({ text: '', words: [], error: 'GROQ_API_KEY not configured' }, { status: 200 })
  }

  try {
    const formData = await request.formData()
    const audio = formData.get('audio') as Blob | null
    if (!audio) {
      return NextResponse.json({ text: '', words: [], error: 'No audio provided' }, { status: 400 })
    }

    // Groq requires a filename with extension
    const mimeType = audio.type || 'audio/webm'
    const ext = mimeType.includes('mp4') ? 'mp4' : mimeType.includes('ogg') ? 'ogg' : 'webm'
    const file = new File([audio], `recording.${ext}`, { type: mimeType })

    const groqForm = new FormData()
    groqForm.append('file', file)
    groqForm.append('model', 'whisper-large-v3-turbo')
    groqForm.append('response_format', 'verbose_json')
    groqForm.append('timestamp_granularities[]', 'word')
    groqForm.append('language', 'en')

    const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: groqForm,
    })

    if (!response.ok) {
      const err = await response.text()
      console.error('Groq transcription error:', err)
      return NextResponse.json({ text: '', words: [], error: `Groq error: ${response.status}` }, { status: 200 })
    }

    const data = await response.json()
    const text: string = data.text ?? ''
    const words: TranscriptWord[] = (data.words ?? []).map((w: any) => ({
      word: w.word,
      start: w.start,
      end: w.end,
    }))

    return NextResponse.json({ text, words })
  } catch (err) {
    console.error('Transcription failed:', err)
    return NextResponse.json({ text: '', words: [], error: 'Transcription failed' }, { status: 200 })
  }
}
