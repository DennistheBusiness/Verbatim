import { NextRequest, NextResponse } from 'next/server'
import convert from 'heic-convert'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

const MAX_IMAGE_BYTES = 10 * 1024 * 1024 // 10 MB

function isHeicOrHeif(file: File) {
  const type = (file.type || '').toLowerCase()
  const ext = (file.name?.split('.').pop() || '').toLowerCase()
  return (
    type.includes('heic') ||
    type.includes('heif') ||
    ext === 'heic' ||
    ext === 'heif'
  )
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const image = formData.get('image') as File | null

    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 })
    }

    if (image.size > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: 'Image too large (max 10 MB)' }, { status: 400 })
    }

    if (!isHeicOrHeif(image)) {
      const passthrough = Buffer.from(await image.arrayBuffer())
      return new NextResponse(passthrough, {
        status: 200,
        headers: {
          'Content-Type': image.type || 'application/octet-stream',
          'Cache-Control': 'no-store',
        },
      })
    }

    const input = Buffer.from(await image.arrayBuffer())
    const output = await convert({
      buffer: input,
      format: 'JPEG',
      quality: 0.92,
    })

    const jpeg = Buffer.isBuffer(output) ? output : Buffer.from(output)

    return new NextResponse(jpeg, {
      status: 200,
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    console.error('normalize-image failed:', error)
    return NextResponse.json({ error: 'Failed to normalize image' }, { status: 400 })
  }
}
