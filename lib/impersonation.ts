/**
 * Impersonation via localStorage has been removed for security reasons.
 * Admin user-data access is now handled server-side via:
 *   GET /api/admin/users/[userId]/sets
 *
 * This file is kept as a shim so existing imports compile.
 * @deprecated
 */

/** @deprecated No-op. Admin queries now go through /api/admin routes. */
export function getEffectiveUserId(actualUserId: string | undefined): string | undefined {
  return actualUserId
}
