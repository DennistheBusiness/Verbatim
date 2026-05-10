"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { CalendarClock, Layers, Bell, BellOff, Smartphone } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Header } from "@/components/header"
import { Spinner } from "@/components/ui/spinner"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty"
import { Button } from "@/components/ui/button"
import { SRToggle } from "@/components/sr-toggle"
import { useSetList, useSetActions } from "@/lib/memorization-context"
import type { RepetitionMode, RepetitionConfig } from "@/lib/memorization-context"
import { createClient } from "@/lib/supabase/client"
import { formatNextReview } from "@/lib/srs"
import {
  checkNotificationPermission,
  requestNotificationPermission,
  scheduleReviewNotifications,
  type NotificationPermission,
} from "@/lib/notifications"
import { Capacitor } from "@capacitor/core"

interface SetDueInfo {
  setId: string
  dueCount: number
  nextDue: string | null
}

function NotificationPermissionCard() {
  const [perm, setPerm] = useState<NotificationPermission | null>(null)

  useEffect(() => {
    checkNotificationPermission().then(setPerm).catch(() => setPerm('denied'))
  }, [])

  if (!Capacitor.isNativePlatform()) {
    return (
      <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-4">
        <Smartphone className="size-5 shrink-0 text-muted-foreground" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">Review reminders</p>
          <p className="text-xs text-muted-foreground">
            Push notifications when chunks are due — available on the Verbatim iOS & Android app
          </p>
        </div>
      </div>
    )
  }

  if (perm === null) return null

  if (perm === 'granted') {
    return (
      <div className="flex items-center gap-3 rounded-xl bg-emerald-50 p-4 dark:bg-emerald-900/20">
        <Bell className="size-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
        <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
          Review reminders are active
        </p>
      </div>
    )
  }

  if (perm === 'denied') {
    return (
      <div className="flex items-center gap-3 rounded-xl border p-4">
        <BellOff className="size-5 shrink-0 text-muted-foreground" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">Notifications blocked</p>
          <p className="text-xs text-muted-foreground">Enable in your device Settings to receive review reminders</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 rounded-xl border-2 border-dashed p-4">
      <BellOff className="size-5 shrink-0 text-muted-foreground" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">Enable review reminders</p>
        <p className="text-xs text-muted-foreground">Get notified when chunks are due for review</p>
      </div>
      <Button
        size="sm"
        className="shrink-0"
        onClick={async () => {
          const granted = await requestNotificationPermission()
          if (granted) {
            setPerm('granted')
            scheduleReviewNotifications().catch(() => {})
          } else {
            setPerm('denied')
          }
        }}
      >
        Enable
      </Button>
    </div>
  )
}

export default function SchedulesPage() {
  const router = useRouter()
  const { sets, isLoaded } = useSetList()
  const { updateRepetitionMode } = useSetActions()
  const supabase = createClient()
  const [dueInfo, setDueInfo] = useState<Map<string, SetDueInfo>>(new Map())
  const [loadingDue, setLoadingDue] = useState(true)

  useEffect(() => {
    if (!isLoaded) return
    async function fetchDue() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from("chunk_progress")
        .select("set_id, next_review_at")
        .eq("user_id", user.id)
        .order("next_review_at", { ascending: true })

      const map = new Map<string, SetDueInfo>()
      for (const row of data ?? []) {
        const now = new Date().toISOString()
        const existing = map.get(row.set_id) ?? { setId: row.set_id, dueCount: 0, nextDue: null }
        if (row.next_review_at <= now) existing.dueCount += 1
        if (!existing.nextDue || row.next_review_at < existing.nextDue) existing.nextDue = row.next_review_at
        map.set(row.set_id, existing)
      }
      setDueInfo(map)
      setLoadingDue(false)
    }
    fetchDue()
  }, [isLoaded]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleModeChange = (setId: string, mode: RepetitionMode, config?: RepetitionConfig) => {
    updateRepetitionMode(setId, mode, config)
  }

  const modeBadgeVariant = (mode: RepetitionMode): "default" | "secondary" | "outline" => {
    if (mode === "ai") return "default"
    if (mode === "manual") return "secondary"
    return "outline"
  }

  if (!isLoaded || loadingDue) {
    return (
      <div className="flex min-h-svh flex-col">
        <Header title="Repetition Schedules" showBack onBack={() => router.push("/")} />
        <div className="flex flex-1 items-center justify-center">
          <Spinner />
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-svh flex-col">
      <Header title="Repetition Schedules" showBack onBack={() => router.push("/")} />
      <main className="flex flex-1 flex-col gap-4 p-4 pb-8">
        {sets.length === 0 ? (
          <Empty className="flex-1 border-0">
            <EmptyHeader>
              <EmptyMedia variant="icon" className="size-12 rounded-full bg-muted text-muted-foreground [&_svg]:size-5">
                <CalendarClock />
              </EmptyMedia>
              <EmptyTitle>No sets yet</EmptyTitle>
              <EmptyDescription>Create a memorization set to start scheduling reviews.</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button onClick={() => router.push("/create")} className="w-full">Create a Set</Button>
            </EmptyContent>
          </Empty>
        ) : (
          <>
            <NotificationPermissionCard />

            <p className="text-sm text-muted-foreground">
              Manage how often each set gets scheduled for review.
            </p>

            <div className="flex flex-col gap-3">
              {sets.map((set) => {
                const info = dueInfo.get(set.id)
                const nextDue = info?.nextDue ? new Date(info.nextDue) : null

                return (
                  <Card key={set.id}>
                    <CardContent className="flex flex-col gap-3 p-4">
                      {/* Set header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex flex-col gap-1 min-w-0">
                          <p className="font-medium text-sm leading-tight truncate">{set.title}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Layers className="size-3" />
                            <span>{set.chunks.length} chunks</span>
                            {info?.dueCount ? (
                              <Badge variant="destructive" className="h-4 px-1.5 text-[10px]">
                                {info.dueCount} due
                              </Badge>
                            ) : nextDue ? (
                              <span className="text-muted-foreground">
                                Next: {formatNextReview(nextDue)}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">Not started</span>
                            )}
                          </div>
                        </div>
                        <Badge variant={modeBadgeVariant(set.repetitionMode)} className="shrink-0 capitalize">
                          {set.repetitionMode === "manual" && set.repetitionConfig.frequency
                            ? `${set.repetitionConfig.frequency}×/${set.repetitionConfig.period}`
                            : set.repetitionMode}
                        </Badge>
                      </div>

                      {/* Toggle */}
                      <SRToggle
                        mode={set.repetitionMode}
                        config={set.repetitionConfig}
                        onModeChange={(mode, config) => handleModeChange(set.id, mode, config)}
                      />
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
