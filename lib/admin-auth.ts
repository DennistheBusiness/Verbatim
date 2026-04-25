import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { adminLimiter, applyRateLimit } from "@/lib/rate-limit"

/**
 * Verifies the caller is an authenticated admin and applies rate limiting.
 * Returns { adminId } on success, or a NextResponse error on failure.
 */
export async function requireAdmin(): Promise<{ adminId: string } | NextResponse> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("user_role")
    .eq("id", user.id)
    .single()

  if (profile?.user_role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  // Rate limit after auth so only valid admins consume quota
  const rateLimitResponse = await applyRateLimit(adminLimiter, `admin:${user.id}`)
  if (rateLimitResponse) return rateLimitResponse

  return { adminId: user.id }
}
