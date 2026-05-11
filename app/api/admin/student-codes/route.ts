import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { requireAdmin } from '@/lib/admin-auth'
import { randomBytes } from 'crypto'

/** GET /api/admin/student-codes — list all codes */
export async function GET() {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

  const service = createServiceClient()
  const { data, error } = await service
    .from('student_codes')
    .select('id, code, max_uses, use_count, created_at, expires_at')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

/** POST /api/admin/student-codes — create a new code */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

  const body = await request.json()
  const { max_uses = 1, expires_at = null } = body as {
    max_uses?: number
    expires_at?: string | null
  }

  // Generate a readable code: VERB-XXXX-XXXX
  const raw = randomBytes(4).toString('hex').toUpperCase()
  const code = `VERB-${raw.slice(0, 4)}-${raw.slice(4, 8)}`

  const service = createServiceClient()
  const { data, error } = await service
    .from('student_codes')
    .insert({
      code,
      max_uses,
      created_by: auth.adminId,
      expires_at: expires_at || null,
    })
    .select('id, code, max_uses, use_count, created_at, expires_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
