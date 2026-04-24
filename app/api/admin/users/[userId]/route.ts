import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { z } from 'zod'

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

const updateRoleSchema = z.object({
  user_role: z.enum(['admin', 'vip', 'general']),
})

/** PATCH /api/admin/users/[userId] — update user role */
export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

  const { userId } = await params

  let body: unknown
  try {
    body = await _request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = updateRoleSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors.map((e) => e.message).join(', ') },
      { status: 400 }
    )
  }

  const service = createServiceClient()

  const { error } = await service
    .from('profiles')
    .update({ user_role: parsed.data.user_role })
    .eq('id', userId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

/** DELETE /api/admin/users/[userId] — delete user and all their data */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

  const { userId } = await params
  const service = createServiceClient()

  // Delete memorization sets (cascades chunks, tags via FK)
  const { error: setsError } = await service
    .from('memorization_sets')
    .delete()
    .eq('user_id', userId)

  if (setsError) {
    return NextResponse.json({ error: setsError.message }, { status: 500 })
  }

  // Delete profile
  const { error: profileError } = await service
    .from('profiles')
    .delete()
    .eq('id', userId)

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }

  // Delete auth user via admin API
  const { error: authError } = await service.auth.admin.deleteUser(userId)
  if (authError) {
    // Non-fatal: profile and data are gone; log and continue
    console.error('[admin/delete] Failed to delete auth user:', authError.message)
  }

  return NextResponse.json({ success: true })
}
