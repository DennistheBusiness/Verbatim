/**
 * Feature flag definitions for Verbatim.
 *
 * access:       which role (or above) can use this feature
 * uiExposed:    whether the feature appears in the main UI
 * adminVisible: whether admins can see the feature in the admin panel
 * comingSoon:   whether to show a "Coming Soon" badge instead of enabling
 */

export type FeatureAccess = 'general' | 'vip' | 'admin'

export interface FeatureFlag {
  access: FeatureAccess
  uiExposed: boolean
  adminVisible: boolean
  comingSoon?: boolean
  description: string
}

export const FEATURE_FLAGS = {
  /** Standard flashcard test mode — all paying users */
  flashcards: {
    access: 'general',
    uiExposed: true,
    adminVisible: true,
    description: 'Flashcard test mode',
  },

  /** PDF import via pdfjs — VIP only, UI not exposed at launch */
  pdfImport: {
    access: 'vip',
    uiExposed: false,
    adminVisible: true,
    description: 'Import content from PDF files',
  },

  /** AI image generation — VIP only, not developed yet */
  aiImageGeneration: {
    access: 'vip',
    uiExposed: false,
    adminVisible: true,
    comingSoon: true,
    description: 'Generate images with AI for memorization sets',
  },
} as const satisfies Record<string, FeatureFlag>

export type FeatureFlagKey = keyof typeof FEATURE_FLAGS

/**
 * Role hierarchy: admin > vip > general
 * Returns true if `userRole` meets the minimum access level required.
 */
export function roleHasAccess(userRole: string, required: FeatureAccess): boolean {
  const hierarchy: Record<FeatureAccess, number> = {
    general: 1,
    vip: 2,
    admin: 3,
  }
  const userLevel = hierarchy[userRole as FeatureAccess] ?? 0
  const requiredLevel = hierarchy[required]
  return userLevel >= requiredLevel
}
