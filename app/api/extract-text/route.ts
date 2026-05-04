import { NextRequest, NextResponse } from 'next/server'
import convert from 'heic-convert'
import { createClient } from '@/lib/supabase/server'
import { ocrLimiter, applyRateLimit } from '@/lib/rate-limit'

export interface ExtractTextResponse {
  text: string
  error?: string
}

const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
  'image/heif',
  'image/heic-sequence',
  'image/heif-sequence',
]
const MAX_IMAGE_BYTES = 10 * 1024 * 1024 // 10 MB

function isHeicOrHeif(type: string, extension: string) {
  return type.includes('heic') || type.includes('heif') || extension === 'heic' || extension === 'heif'
}

export async function POST(request: NextRequest): Promise<NextResponse<ExtractTextResponse>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ text: '', error: 'Unauthorized' }, { status: 401 })
  }

  const rateLimitResponse = await applyRateLimit(ocrLimiter, `ocr:${user.id}`)
  if (rateLimitResponse) {
    return NextResponse.json({ text: '', error: 'Too many requests. Please try again later.' }, { status: 429 })
  }

  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    return NextResponse.json({ text: '', error: 'OCR not configured' }, { status: 200 })
  }

  try {
    const formData = await request.formData()
    const image = formData.get('image') as Blob | null
    if (!image) {
      return NextResponse.json({ text: '', error: 'No image provided' }, { status: 400 })
    }

    if (image.size > MAX_IMAGE_BYTES) {
      return NextResponse.json({ text: '', error: 'Image too large (max 10 MB)' }, { status: 400 })
    }

    const imageFile = image as File
    const extension = (imageFile.name?.split('.').pop() || '').toLowerCase()
    const mimeTypeRaw = (image.type || '').toLowerCase()

    const mimeType = ALLOWED_IMAGE_TYPES.includes(mimeTypeRaw)
      ? mimeTypeRaw
      : (extension === 'heic' || extension === 'heif')
        ? 'image/heic'
        : mimeTypeRaw || 'image/jpeg'

    if (!ALLOWED_IMAGE_TYPES.includes(mimeType)) {
      return NextResponse.json({ text: '', error: 'Unsupported image type' }, { status: 400 })
    }

    const sourceBuffer = Buffer.from(await image.arrayBuffer())

    let payloadBuffer = sourceBuffer
    let payloadMime = mimeType

    if (isHeicOrHeif(mimeTypeRaw, extension)) {
      try {
        const output = await convert({
          buffer: sourceBuffer,
          format: 'JPEG',
          quality: 0.92,
        })
        payloadBuffer = Buffer.isBuffer(output) ? output : Buffer.from(output)
        payloadMime = 'image/jpeg'
      } catch (conversionError) {
        console.error('HEIC conversion failed:', conversionError)
        return NextResponse.json({ text: '', error: 'Unsupported image type' }, { status: 400 })
      }
    }

    const base64 = payloadBuffer.toString('base64')
    const dataUrl = `data:${payloadMime};base64,${base64}`

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'image_url', image_url: { url: dataUrl } },
              { type: 'text', text: 'Extract all visible text from this image exactly as written. Return only the extracted text with no commentary.' },
            ],
          },
        ],
        max_tokens: 4096,
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      console.error('Groq OCR error:', err)
      return NextResponse.json({ text: '', error: 'AI extraction failed. Please try again.' }, { status: 200 })
    }

    const data = await response.json()
    const text: string = data.choices?.[0]?.message?.content ?? ''

    return NextResponse.json({ text })
  } catch (err) {
    console.error('OCR extraction failed:', err)
    return NextResponse.json({ text: '', error: 'OCR extraction failed' }, { status: 200 })
  }
}
