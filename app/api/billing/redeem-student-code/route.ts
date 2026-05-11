import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

const STUDENT_TRIAL_DAYS = 60

/**
 * POST /api/billing/redeem-student-code
 * Body: { code: string }
 *
 * Validates a student access code and extends the user's trial to 60 days
 * and sets their role to 'student'.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { code } = body as { code: string }

  if (!code || typeof code !== 'string') {
    return NextResponse.json({ error: 'Missing code' }, { status: 400 })
  }

  const normalizedCode = code.trim().toUpperCase()

  // Check master code first (env var — no DB lookup needed)
  const masterCode = process.env.STUDENT_MASTER_CODE
  const isMaster = masterCode && normalizedCode === masterCode.toUpperCase()

  const service = createServiceClient()

  if (!isMaster) {
    // Look up in student_codes table
    const { data: codeRow } = await service
      .from('student_codes')
      .select('id, max_uses, use_count, expires_at')
      .eq('code', normalizedCode)
      .single()

    if (!codeRow) {
      return NextResponse.json({ error: 'Invalid code' }, { status: 404 })
    }

    if (codeRow.expires_at && new Date(codeRow.expires_at) < new Date()) {
      return NextResponse.json({ error: 'This code has expired' }, { status: 410 })
    }

    if (codeRow.use_count >= codeRow.max_uses) {
      return NextResponse.json({ error: 'This code has already been used the maximum number of times' }, { status: 409 })
    }

    // Increment use count
    await service
      .from('student_codes')
      .update({ use_count: codeRow.use_count + 1 })
      .eq('id', codeRow.id)
  }

  // Extend trial and mark as student
  const trialEndsAt = new Date(Date.now() + STUDENT_TRIAL_DAYS * 24 * 60 * 60 * 1000).toISOString()

  const { error } = await service
    .from('profiles')
    .update({
      user_role: 'student',
      trial_ends_at: trialEndsAt,
      subscription_status: 'trialing',
    })
    .eq('id', user.id)

  if (error) {
    return NextResponse.json({ error: 'Failed to apply code' }, { status: 500 })
  }

  return NextResponse.json({ success: true, trialEndsAt })
}
