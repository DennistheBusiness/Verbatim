import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { requireAdmin } from '@/lib/admin-auth'

/**
 * GET /api/admin/users/[userId]/sets
 * Returns the target user's memorization sets (admin only, service role).
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

  const { userId } = await params
  const service = createServiceClient()

  const { data, error } = await service
    .from('memorization_sets')
    .select(`
      id, title, content, chunk_mode, created_at, updated_at,
      progress, audio_file_path,
      chunks (id, order_index, text),
      set_tags (tag:tags (name))
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
