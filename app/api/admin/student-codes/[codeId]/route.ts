import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { requireAdmin } from '@/lib/admin-auth'

/** DELETE /api/admin/student-codes/[codeId] — revoke a code */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ codeId: string }> }
) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

  const { codeId } = await params
  const service = createServiceClient()

  const { error } = await service
    .from('student_codes')
    .delete()
    .eq('id', codeId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
