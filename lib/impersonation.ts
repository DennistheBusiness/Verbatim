/**
 * Impersonation utilities for admin users
 */

export interface ImpersonationState {
  isImpersonating: boolean
  originalUserId: string | null
  targetUserId: string | null
  targetUserEmail: string | null
}

/**
 * Check if currently impersonating another user
 */
export function getImpersonationState(): ImpersonationState {
  if (typeof window === 'undefined') {
    return {
      isImpersonating: false,
      originalUserId: null,
      targetUserId: null,
      targetUserEmail: null,
    }
  }

  const isImpersonating = localStorage.getItem('impersonating') === 'true'
  const originalUserId = localStorage.getItem('originalUserId')
  const targetUserId = localStorage.getItem('targetUserId')
  const targetUserEmail = localStorage.getItem('targetUserEmail')

  return {
    isImpersonating,
    originalUserId,
    targetUserId,
    targetUserEmail,
  }
}

/**
 * Get the effective user ID to use for queries
 * Returns the impersonated user ID if impersonating, otherwise the actual user ID
 */
export function getEffectiveUserId(actualUserId: string | undefined): string | undefined {
  const { isImpersonating, targetUserId } = getImpersonationState()
  
  if (isImpersonating && targetUserId) {
    return targetUserId
  }
  
  return actualUserId
}

/**
 * End impersonation and return to admin view
 */
export function endImpersonation(): void {
  localStorage.removeItem('impersonating')
  localStorage.removeItem('originalUserId')
  localStorage.removeItem('targetUserId')
  localStorage.removeItem('targetUserEmail')
}

/**
 * Start impersonating a user
 */
export function startImpersonation(originalUserId: string, targetUserId: string, targetUserEmail: string): void {
  localStorage.setItem('impersonating', 'true')
  localStorage.setItem('originalUserId', originalUserId)
  localStorage.setItem('targetUserId', targetUserId)
  localStorage.setItem('targetUserEmail', targetUserEmail)
}
