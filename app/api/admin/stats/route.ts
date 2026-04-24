import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

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

/** GET /api/admin/stats */
export async function GET() {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

  const service = createServiceClient()

  const [{ count: userCount }, { count: setCount }] = await Promise.all([
    service.from('profiles').select('*', { count: 'exact', head: true }),
    service.from('memorization_sets').select('*', { count: 'exact', head: true }),
  ])

  return NextResponse.json({
    totalUsers: userCount ?? 0,
    totalSets: setCount ?? 0,
    activeUsers: userCount ?? 0,
    pendingDeletes: 0,
  })
}
