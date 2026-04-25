"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Flame, CalendarClock, CheckCircle2, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { formatNextReview } from "@/lib/srs"

type BannerState = "loading" | "due" | "caught-up" | "not-started"

interface DueData { totalChunks: number; totalSets: number }
interface UpNextData { nextReviewAt: Date }

export function TodaysPracticeBanner() {
  const [state, setState] = useState<BannerState>("loading")
  const [dueData, setDueData] = useState<DueData | null>(null)
  const [upNextData, setUpNextData] = useState<UpNextData | null>(null)
  const router = useRouter()
  const supabase = createClient()

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
              Next review: {formatNextReview(upNextData.nextReviewAt)}
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

  return (
    <div className="rounded-2xl border-2 border-dashed border-primary/20 bg-primary/5 p-4">
      <div className="flex items-center gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <CalendarClock className="size-6 text-primary" />
        </div>
        <div className="flex flex-1 flex-col gap-0.5 min-w-0">
          <p className="font-semibold text-base leading-tight">Spaced Repetition</p>
          <p className="text-sm text-muted-foreground leading-snug">
            Review what you need, when you need it
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => router.push("/schedules")}
          className="shrink-0 gap-1.5"
        >
          Set Up
          <ArrowRight className="size-3.5" />
        </Button>
      </div>
    </div>
  )
}
