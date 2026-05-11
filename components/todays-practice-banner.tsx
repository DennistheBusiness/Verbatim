"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Flame, CheckCircle2, ArrowRight, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { formatNextReview } from "@/lib/srs"
import { useSetList } from "@/lib/memorization-context"

type BannerState = "loading" | "due" | "caught-up" | "not-started"

interface DueData { totalChunks: number; totalSets: number }
interface UpNextData { nextReviewAt: Date }

export function TodaysPracticeBanner() {
  const [state, setState] = useState<BannerState>("loading")
  const [dueData, setDueData] = useState<DueData | null>(null)
  const [upNextData, setUpNextData] = useState<UpNextData | null>(null)
  const router = useRouter()
  const supabase = createClient()
  const { sets } = useSetList()
  const activeSetsCount = sets.filter(s => (s.progress.streak?.currentStreak ?? 0) > 0).length

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { setState("not-started"); return }

        const { data, error } = await supabase
          .from("chunk_progress")
          .select("set_id, next_review_at")
          .eq("user_id", user.id)
          .order("next_review_at", { ascending: true })

        if (error || !data || data.length === 0) { setState("not-started"); return }

        const now = new Date().toISOString()
        const dueItems = data.filter((r) => r.next_review_at <= now)

        if (dueItems.length > 0) {
          const uniqueSets = new Set(dueItems.map((r) => r.set_id)).size
          setDueData({ totalChunks: dueItems.length, totalSets: uniqueSets })
          setState("due")
        } else {
          setUpNextData({ nextReviewAt: new Date(data[0].next_review_at) })
          setState("caught-up")
        }
      } catch {
        setState("not-started")
      }
    }
    fetchData()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (state === "loading") return null

  if (state === "due" && dueData) {
    return (
      <div className="rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 p-4 text-white shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/20">
            <Flame className="size-6" />
          </div>
          <div className="flex flex-1 flex-col gap-0.5 min-w-0">
            <p className="font-semibold text-base leading-tight">Practice Ready</p>
            <p className="text-sm text-white/80">
              {dueData.totalChunks} chunk{dueData.totalChunks !== 1 ? "s" : ""} due
              {" · "}
              {dueData.totalSets} set{dueData.totalSets !== 1 ? "s" : ""}
              {activeSetsCount > 0 && ` · 🔥 ${activeSetsCount} active`}
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => router.push("/review")}
            className="shrink-0 bg-white text-orange-600 hover:bg-white/90 gap-1.5 font-semibold"
          >
            Start
            <ArrowRight className="size-3.5" />
          </Button>
        </div>
      </div>
    )
  }

  if (state === "caught-up" && upNextData) {
    return (
      <div className="rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 p-4 text-white shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/20">
            <CheckCircle2 className="size-6" />
          </div>
          <div className="flex flex-1 flex-col gap-0.5 min-w-0">
            <p className="font-semibold text-base leading-tight">All Caught Up</p>
            <p className="text-sm text-white/80">
              {activeSetsCount > 0
                ? `🔥 ${activeSetsCount} active streak${activeSetsCount !== 1 ? "s" : ""} · Next: ${formatNextReview(upNextData.nextReviewAt)}`
                : `Next review: ${formatNextReview(upNextData.nextReviewAt)}`}
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => router.push("/schedules")}
            className="shrink-0 bg-white text-emerald-600 hover:bg-white/90 font-semibold"
          >
            Schedule
          </Button>
        </div>
      </div>
    )
  }

  // "not-started" → show progress bar of most recent set (or nothing if no sets)
  const recentSet = sets.length > 0
    ? [...sets].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0]
    : null

  if (!recentSet) return null

  // Compute step progress for most recent set
  const teachPct = recentSet.progress.familiarizeCompleted ? 100
    : Math.min(((recentSet.progress.reviewedChunks?.length ?? 0) / Math.max(recentSet.chunks.length, 1)) * 100, 99)
  const trainStages = [
    recentSet.progress.encode.stage1Completed,
    recentSet.progress.encode.stage2Completed,
    recentSet.progress.encode.stage3Completed,
  ].filter(Boolean).length
  const trainPct = Math.round((trainStages / 3) * 100)
  const testScores = [
    recentSet.progress.tests.firstLetter.bestScore,
    recentSet.progress.tests.fullText.bestScore,
    recentSet.progress.tests.audioTest.bestScore,
  ].filter((s): s is number => s !== null)
  const testPct = testScores.length > 0 ? Math.max(...testScores) : 0
  const overallPct = Math.round(teachPct * 0.25 + trainPct * 0.35 + testPct * 0.40)

  const teachStatus = recentSet.progress.familiarizeCompleted ? "✓ Done"
    : (recentSet.progress.reviewedChunks?.length ?? 0) > 0
      ? `${recentSet.progress.reviewedChunks!.length}/${recentSet.chunks.length} cards`
      : "Not started"
  const trainStatus = trainStages === 0 ? "Not started" : trainStages === 3 ? "✓ Done" : `Stage ${trainStages}/3`
  const testStatus = testPct > 0 ? `Best: ${testPct}%` : "Not started"

  return (
    <button
      onClick={() => router.push(`/memorization/${recentSet.id}`)}
      className="w-full text-left rounded-2xl border border-border bg-card p-4 shadow-sm hover:shadow-md active:opacity-90 transition-all"
    >
      <div className="flex flex-col gap-3">
        {/* Title row */}
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold leading-tight truncate">{recentSet.title}</p>
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-xs font-bold text-primary tabular-nums">{overallPct}%</span>
            <ChevronRight className="size-4 text-muted-foreground" />
          </div>
        </div>

        {/* 3-segment bar */}
        <div className="flex gap-1 h-2.5">
          <div className="flex-1 rounded-l-full overflow-hidden bg-blue-500/20">
            <div className="h-full bg-blue-500 transition-all duration-500 rounded-l-full" style={{ width: `${teachPct}%` }} />
          </div>
          <div className="flex-1 overflow-hidden bg-violet-500/20">
            <div className="h-full bg-violet-500 transition-all duration-500" style={{ width: `${trainPct}%` }} />
          </div>
          <div className="flex-1 rounded-r-full overflow-hidden bg-emerald-500/20">
            <div className="h-full bg-emerald-500 transition-all duration-500 rounded-r-full" style={{ width: `${testPct}%` }} />
          </div>
        </div>

        {/* Labels */}
        <div className="flex">
          <div className="flex-1">
            <span className="text-[10px] font-semibold text-blue-500">Teach</span>
            <p className="text-[10px] text-muted-foreground leading-tight">{teachStatus}</p>
          </div>
          <div className="flex-1">
            <span className="text-[10px] font-semibold text-violet-500">Train</span>
            <p className="text-[10px] text-muted-foreground leading-tight">{trainStatus}</p>
          </div>
          <div className="flex-1">
            <span className="text-[10px] font-semibold text-emerald-500">Test</span>
            <p className="text-[10px] text-muted-foreground leading-tight">{testStatus}</p>
          </div>
        </div>
      </div>
    </button>
  )
}
