'use client'

import { Capacitor } from '@capacitor/core'
import { createClient } from '@/lib/supabase/client'

export type NotificationPermission = 'granted' | 'denied' | 'prompt'

export async function checkNotificationPermission(): Promise<NotificationPermission> {
  if (!Capacitor.isNativePlatform()) return 'denied'
  const { LocalNotifications } = await import('@capacitor/local-notifications')
  const { display } = await LocalNotifications.checkPermissions()
  return display as NotificationPermission
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false
  const { LocalNotifications } = await import('@capacitor/local-notifications')
  const { display } = await LocalNotifications.requestPermissions()
  return display === 'granted'
}

export async function scheduleReviewNotifications(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return
  const perm = await checkNotificationPermission()
  if (perm !== 'granted') return

  const { LocalNotifications } = await import('@capacitor/local-notifications')
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  // Get sets with active SRS mode (AI or Manual — not off)
  const { data: sets } = await supabase
    .from('memorization_sets')
    .select('id, title, repetition_mode')
    .eq('user_id', user.id)
    .neq('repetition_mode', 'off')
  if (!sets?.length) return

  const setIds = sets.map(s => s.id)

  // Get upcoming (future) chunk_progress rows
  const now = new Date().toISOString()
  const { data: upcoming } = await supabase
    .from('chunk_progress')
    .select('set_id, next_review_at')
    .eq('user_id', user.id)
    .gt('next_review_at', now)
    .in('set_id', setIds)
    .order('next_review_at', { ascending: true })
  if (!upcoming?.length) return

  // Group by set: earliest next_review_at and total count
  const bySet = new Map<string, { earliest: Date; count: number }>()
  for (const row of upcoming) {
    const at = new Date(row.next_review_at)
    const existing = bySet.get(row.set_id)
    if (!existing) {
      bySet.set(row.set_id, { earliest: at, count: 1 })
    } else {
      existing.count++
      if (at < existing.earliest) existing.earliest = at
    }
  }

  // Ensure Android notification channel exists (no-op on iOS)
  await LocalNotifications.createChannel({
    id: 'srs-reminders',
    name: 'Review Reminders',
    description: 'Notifies you when memorization chunks are due for review',
    importance: 4, // HIGH
    visibility: 1, // PUBLIC
    vibration: true,
  }).catch(() => {})

  // Clear existing scheduled notifications then reschedule
  const { notifications: pending } = await LocalNotifications.getPending()
  if (pending.length) await LocalNotifications.cancel({ notifications: pending })

  const notifications = Array.from(bySet.entries())
    .sort((a, b) => a[1].earliest.getTime() - b[1].earliest.getTime())
    .slice(0, 20) // iOS allows 64; cap at 20 for cleanliness
    .map(([setId, { earliest, count }]) => {
      const set = sets.find(s => s.id === setId)!
      return {
        id: stableId(setId),
        title: 'Time to review',
        body: count === 1
          ? `"${set.title}" has a chunk ready`
          : `"${set.title}" has ${count} chunks ready`,
        schedule: { at: earliest, allowWhileIdle: true },
        extra: { route: '/review' },
        channelId: 'srs-reminders',
      }
    })

  if (notifications.length) {
    await LocalNotifications.schedule({ notifications })
  }
}

export async function setupNotificationListeners(push: (path: string) => void): Promise<void> {
  if (!Capacitor.isNativePlatform()) return
  const { LocalNotifications } = await import('@capacitor/local-notifications')
  LocalNotifications.addListener('localNotificationActionPerformed', (action) => {
    const route = action.notification.extra?.route as string | undefined
    push(route ?? '/review')
  })
}

// Converts a UUID to a stable positive int32 (LocalNotifications requires integer IDs)
function stableId(uuid: string): number {
  let h = 0
  for (let i = 0; i < uuid.length; i++) {
    h = Math.imul(31, h) + uuid.charCodeAt(i) | 0
  }
  return Math.abs(h) % 2_147_483_647 || 1
}
