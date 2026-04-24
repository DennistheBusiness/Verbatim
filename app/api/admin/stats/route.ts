import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { requireAdmin } from '@/lib/admin-auth'

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
