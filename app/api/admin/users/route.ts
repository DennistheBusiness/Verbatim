import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

/**
 * Verifies the caller is an authenticated admin.
 * Returns { adminId } on success, or a NextResponse error on failure.
 */
async function requireAdmin(): Promise<{ adminId: string } | NextResponse> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('user_role')
    .eq('id', user.id)
    .single()

  if (profile?.user_role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return { adminId: user.id }
}

/** GET /api/admin/users — list all user profiles */
export async function GET() {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

  const service = createServiceClient()

  const { data, error } = await service
    .from('profiles')
    .select('id, email, full_name, user_role, created_at, avatar_url')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
