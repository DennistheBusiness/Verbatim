/**
 * Analytics Event Definitions
 * 
 * Centralized constants for all tracked events in the application.
 * Used with PostHog analytics to ensure consistent event naming.
 * 
 * @see lib/analytics.ts for tracking implementation
 */

// ============================================================================
// USER LIFECYCLE EVENTS
// ============================================================================

/**
 * User completes signup process
 * Properties: method (email/oauth), referral_source
 */
export const USER_SIGNED_UP = 'user_signed_up'

/**
 * User successfully logs in
 * Properties: method (email/oauth)
 */
export const USER_LOGGED_IN = 'user_logged_in'

/**
 * User logs out
 */
export const USER_LOGGED_OUT = 'user_logged_out'

/**
 * User starts a new session
 * Tracked once per day for DAU calculation
 */
export const SESSION_STARTED = 'session_started'

// ============================================================================
// MEMORIZATION LIFECYCLE EVENTS
// ============================================================================

/**
 * User creates a new memorization set
 * Properties: chunk_mode, has_audio, content_length, chunk_count, tags_count
 */
export const MEMORIZATION_CREATED = 'memorization_created'

/**
 * User updates an existing memorization set
 * Properties: set_id, changed_fields (title/content/tags/audio), chunk_mode
 */
export const MEMORIZATION_UPDATED = 'memorization_updated'

/**
 * User deletes a memorization set
 * Properties: set_id, set_age_days, completion_percentage, had_audio
 */
export const MEMORIZATION_DELETED = 'memorization_deleted'

/**
 * User changes chunk mode for a set
 * Properties: set_id, old_mode, new_mode, chunk_count_before, chunk_count_after
 */
export const CHUNK_MODE_CHANGED = 'chunk_mode_changed'

/**
 * User updates tags for a memorization set
 * Properties: set_id, tags_added, tags_removed, total_tags
 */
export const TAGS_UPDATED = 'tags_updated'

// ============================================================================
// LEARNING PROGRESS EVENTS
// ============================================================================

/**
 * User completes familiarization step
 * Properties: set_id, time_spent_seconds, chunk_count
 */
export const FAMILIARIZE_COMPLETED = 'familiarize_completed'

/**
 * User starts an encode stage
 * Properties: set_id, stage (1/2/3)
 */
export const ENCODE_STARTED = 'encode_started'

/**
 * User completes an encode stage
 * Properties: set_id, stage (1/2/3), score, time_spent_seconds
 */
export const ENCODE_COMPLETED = 'encode_completed'

/**
 * User starts a test
 * Properties: set_id, test_type (first_letter/full_text/audio), chunk_count
 */
export const TEST_STARTED = 'test_started'

/**
 * User completes a test
 * Properties: set_id, test_type, score, duration_seconds, is_best_score, improvement_percentage
 */
export const TEST_COMPLETED = 'test_completed'

/**
 * User reviews a chunk in flashcard mode
 * Properties: set_id, chunk_id, chunk_index, total_reviewed
 */
export const CHUNK_REVIEWED = 'chunk_reviewed'

/**
 * User marks a chunk for later review
 * Properties: set_id, chunk_id, chunk_index, total_marked
 */
export const CHUNK_MARKED = 'chunk_marked'

/**
 * User completes entire memorization flow
 * Properties: set_id, total_time_days, best_score, completion_rate
 */
export const MEMORIZATION_COMPLETED = 'memorization_completed'

// ============================================================================
// FEATURE USAGE EVENTS
// ============================================================================

/**
 * User performs a search
 * Properties: query_length, has_results, result_count
 */
export const SEARCH_PERFORMED = 'search_performed'

/**
 * User filters by tag
 * Properties: tag_name, selected_tags_count, filtered_results_count
 */
export const TAG_FILTER_APPLIED = 'tag_filter_applied'

/**
 * User clears all filters
 * Properties: had_search, had_tags, total_sets_visible
 */
export const FILTERS_CLEARED = 'filters_cleared'

/**
 * User plays audio recording
 * Properties: set_id, audio_duration_seconds, playback_position
 */
export const AUDIO_PLAYED = 'audio_played'

/**
 * User records new audio
 * Properties: set_id, recording_duration_seconds, is_replacement
 */
export const AUDIO_RECORDED = 'audio_recorded'

/**
 * User deletes audio recording
 * Properties: set_id, audio_duration_seconds
 */
export const AUDIO_DELETED = 'audio_deleted'

/**
 * User navigates to edit page
 * Properties: set_id, from_page
 */
export const EDIT_STARTED = 'edit_started'

/**
 * User views onboarding tip
 * Properties: tip_id, tip_title, page, tip_number
 */
export const ONBOARDING_TIP_VIEWED = 'onboarding_tip_viewed'

/**
 * User dismisses onboarding tip
 * Properties: tip_id, tip_title, dismissed_all
 */
export const ONBOARDING_TIP_DISMISSED = 'onboarding_tip_dismissed'

// ============================================================================
// RETENTION EVENTS (FOR COHORT ANALYSIS)
// ============================================================================

/**
 * User performs any practice activity
 * Tracks engagement for retention analysis
 * Properties: activity_type (familiarize/encode/test)
 */
export const PRACTICE_SESSION = 'practice_session'

/**
 * Daily active user marker
 * Tracked once per day per user
 */
export const DAILY_ACTIVE = 'daily_active'

/**
 * Weekly active user marker
 * Tracked once per week per user
 */
export const WEEKLY_ACTIVE = 'weekly_active'

// ============================================================================
// ADMIN EVENTS
// ============================================================================

/**
 * Admin impersonates a user
 * Properties: target_user_id, target_user_email
 */
export const ADMIN_IMPERSONATION_STARTED = 'admin_impersonation_started'

/**
 * Admin stops impersonating
 * Properties: duration_seconds
 */
export const ADMIN_IMPERSONATION_STOPPED = 'admin_impersonation_stopped'

/**
 * Admin changes user role
 * Properties: target_user_id, old_role, new_role
 */
export const ADMIN_ROLE_CHANGED = 'admin_role_changed'

/**
 * Admin deletes user account
 * Properties: target_user_id, user_sets_count, user_age_days
 */
export const ADMIN_USER_DELETED = 'admin_user_deleted'

// ============================================================================
// ERROR EVENTS
// ============================================================================

/**
 * User encounters an error
 * Properties: error_type, error_message, page, action_attempted
 */
export const ERROR_ENCOUNTERED = 'error_encountered'

/**
 * User clicks retry on error
 * Properties: error_type, retry_successful
 */
export const ERROR_RETRY = 'error_retry'

/**
 * User selects a training method in the encode step
 * Properties: set_id, method ('first_letter' | 'sorting'), chunk_count
 */
export const ENCODE_METHOD_SELECTED = 'encode_method_selected'

/**
 * User starts a sorting game session
 * Properties: set_id, chunk_count, chunk_mode
 */
export const SORTING_GAME_STARTED = 'sorting_game_started'

/**
 * User submits a sorting game attempt
 * Properties: set_id, score, correct_positions, total_chunks, chunk_mode, duration_seconds
 */
export const SORTING_GAME_COMPLETED = 'sorting_game_completed'

// ============================================================================
// TYPE DEFINITIONS FOR PROPERTIES
// ============================================================================

export type ChunkMode = 'line' | 'paragraph' | 'sentence' | 'custom'
export type TestType = 'first_letter' | 'full_text' | 'audio'
export type EncodeStage = 1 | 2 | 3
export type EncodeMethod = 'first_letter' | 'sorting'
export type ActivityType = 'familiarize' | 'encode' | 'test'
export type AuthMethod = 'email' | 'google' | 'oauth'

// ============================================================================
// EVENT PROPERTY INTERFACES
// ============================================================================

export interface MemorizationCreatedProperties {
  chunk_mode: ChunkMode
  has_audio: boolean
  content_length: number
  chunk_count: number
  tags_count: number
  created_from?: 'text' | 'voice'
}

export interface TestCompletedProperties {
  set_id: string
  test_type: TestType
  score: number
  duration_seconds: number
  is_best_score: boolean
  improvement_percentage?: number
  chunk_count: number
}

export interface SearchProperties {
  query_length: number
  has_results: boolean
  result_count: number
}

export interface ErrorProperties {
  error_type: string
  error_message: string
  page: string
  action_attempted: string
  stack_trace?: string
}

export interface UserProperties {
  email?: string
  role?: 'admin' | 'vip' | 'general'
  signup_date?: string
  total_sets?: number
  total_tests_completed?: number
  average_score?: number
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate time difference in seconds
 */
export function getTimeDifferenceSeconds(startDate: Date | string, endDate: Date | string = new Date()): number {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate
  return Math.round((end.getTime() - start.getTime()) / 1000)
}

/**
 * Calculate time difference in days
 */
export function getTimeDifferenceDays(startDate: Date | string, endDate: Date | string = new Date()): number {
  return Math.round(getTimeDifferenceSeconds(startDate, endDate) / (60 * 60 * 24))
}

/**
 * Calculate completion percentage
 */
export function calculateCompletionPercentage(completed: number, total: number): number {
  if (total === 0) return 0
  return Math.round((completed / total) * 100)
}
