/**
 * Entitlement resolution for Verbatim.
 *
 * An "entitlement" is the combination of:
 *   - Whether a user currently has access to the app at all
 *   - Which feature tier they're on (general / vip / admin)
 *
 * Rules:
 *   admin   → always active, all features
 *   trialing → access for 7 days (or 60 with student code), then hits paywall
 *   active  → full access at their plan's feature level
 *   past_due → grace period (3 days), then restricted
 *   canceled / none → redirected to /subscribe
 */

export type PlanType = 'none' | 'monthly' | 'annual' | 'three_year' | 'free'
export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'canceled' | 'paused'
export type UserRole = 'general' | 'vip' | 'student' | 'admin'

export interface BillingProfile {
  user_role: string
  plan_type: string
  subscription_status: string
  trial_ends_at: string | null
  plan_expires_at: string | null
}

export interface Entitlement {
  /** Whether the user can access the app */
  hasAccess: boolean
  /** Effective feature tier */
  tier: UserRole
  /** Whether they are currently in a trial */
  isTrial: boolean
  /** ISO date string when trial expires (null if not trialing) */
  trialEndsAt: string | null
  /** Whether the account is fully active (paid or admin/free) */
  isActive: boolean
  /** Whether access is expired and user needs to subscribe */
  needsSubscription: boolean
  /** Raw plan for display purposes */
  planType: PlanType
  /** Raw status */
  status: SubscriptionStatus
}

/**
 * Derive an Entitlement from a billing profile row.
 * Safe to call on client or server — no DB queries.
 */
export function resolveEntitlement(profile: BillingProfile): Entitlement {
  const role = (profile.user_role || 'general') as UserRole
  const status = (profile.subscription_status || 'trialing') as SubscriptionStatus
  const planType = (profile.plan_type || 'none') as PlanType

  // Admins always have full access
  if (role === 'admin') {
    return {
      hasAccess: true,
      tier: 'admin',
      isTrial: false,
      trialEndsAt: null,
      isActive: true,
      needsSubscription: false,
      planType: 'free',
      status: 'active',
    }
  }

  // Free plan (admin-granted)
  if (planType === 'free') {
    return {
      hasAccess: true,
      tier: role,
      isTrial: false,
      trialEndsAt: null,
      isActive: true,
      needsSubscription: false,
      planType: 'free',
      status: 'active',
    }
  }

  // Active paid subscription
  if (status === 'active') {
    // Check if annual/three_year plan has expired
    if (planType !== 'monthly' && profile.plan_expires_at) {
      const expired = new Date(profile.plan_expires_at) < new Date()
      if (expired) {
        return {
          hasAccess: false,
          tier: role,
          isTrial: false,
          trialEndsAt: null,
          isActive: false,
          needsSubscription: true,
          planType,
          status: 'canceled',
        }
      }
    }
    return {
      hasAccess: true,
      tier: role,
      isTrial: false,
      trialEndsAt: null,
      isActive: true,
      needsSubscription: false,
      planType,
      status: 'active',
    }
  }

  // Trialing
  if (status === 'trialing') {
    const trialEnd = profile.trial_ends_at ? new Date(profile.trial_ends_at) : null
    const inTrial = trialEnd ? trialEnd > new Date() : false
    return {
      hasAccess: inTrial,
      tier: role,
      isTrial: true,
      trialEndsAt: profile.trial_ends_at,
      isActive: false,
      needsSubscription: !inTrial,
      planType: 'none',
      status: 'trialing',
    }
  }

  // Past due — 3-day grace period
  if (status === 'past_due') {
    return {
      hasAccess: true, // keep access, show warning banner
      tier: role,
      isTrial: false,
      trialEndsAt: null,
      isActive: false,
      needsSubscription: false, // will be pushed to update payment, not subscribe
      planType,
      status: 'past_due',
    }
  }

  // Canceled or paused — no access
  return {
    hasAccess: false,
    tier: role,
    isTrial: false,
    trialEndsAt: null,
    isActive: false,
    needsSubscription: true,
    planType,
    status,
  }
}

/** Returns number of days remaining in trial (0 if expired or not trialing) */
export function trialDaysRemaining(trialEndsAt: string | null): number {
  if (!trialEndsAt) return 0
  const diff = new Date(trialEndsAt).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}
