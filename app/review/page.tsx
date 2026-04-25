"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2, AlertTriangle, XCircle, Eye, ArrowRight, RotateCcw, Trophy, Layers } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Header } from "@/components/header"
import { Spinner } from "@/components/ui/spinner"
import { ReviewFeedbackCard } from "@/components/review-feedback-card"
import { SRToggle } from "@/components/sr-toggle"
import { createClient } from "@/lib/supabase/client"
import { useSetList, useSetActions } from "@/lib/memorization-context"
import type { MemorizationSet, ChunkProgressRow } from "@/lib/memorization-context"
import type { SRSGrade } from "@/lib/srs"

type ReviewMode =
  | "loading"
  | "queue-overview"
  | "chunk-show"
  | "chunk-reveal"
  | "chunk-feedback"
  | "full-set-prompt"
  | "complete"

interface SetQueue {
  set: MemorizationSet
  dueChunks: ChunkProgressRow[]
}

// Score values for each self-rating
const GRADE_SCORES: Record<SRSGrade, number> = {
  perfect: 95,
  medium: 72,
  fail: 30,
}

export default function ReviewPage() {
  const router = useRouter()
  const { sets, isLoaded } = useSetList()
  const { upsertChunkProgress, updateRepetitionMode } = useSetActions()
  const supabase = createClient()

  const [mode, setMode] = useState<ReviewMode>("loading")
  const [queue, setQueue] = useState<SetQueue[]>([])
  const [queueIndex, setQueueIndex] = useState(0)
  const [chunkIndex, setChunkIndex] = useState(0)
  const [lastFeedback, setLastFeedback] = useState<{ grade: SRSGrade; score: number; nextReviewAt: Date } | null>(null)
  const [showSRToggle, setShowSRToggle] = useState(false)
  const [completedSets, setCompletedSets] = useState(0)

  useEffect(() => {
    if (!isLoaded) return
    async function buildQueue() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push("/auth/login"); return }

      const { data: dueRows } = await supabase
        .from("chunk_progress")
        .select("id, chunk_id, set_id, ease_factor, interval_days, repetitions, last_score, last_reviewed_at, next_review_at")
        .eq("user_id", user.id)
        .lte("next_review_at", new Date().toISOString())
        .order("ease_factor", { ascending: true })

      if (!dueRows || dueRows.length === 0) { setMode("complete"); return }

      const bySet = new Map<string, ChunkProgressRow[]>()
      for (const row of dueRows) {
        const arr = bySet.get(row.set_id) ?? []
        arr.push(row as ChunkProgressRow)
        bySet.set(row.set_id, arr)
      }

      const q: SetQueue[] = []
      for (const [setId, chunks] of bySet.entries()) {
        const set = sets.find((s) => s.id === setId)
        if (set && set.repetitionMode !== "off") q.push({ set, dueChunks: chunks })
      }

      if (q.length === 0) { setMode("complete"); return }
      setQueue(q)
      setQueueIndex(0)
      setChunkIndex(0)
      setMode("queue-overview")
    }
    buildQueue()
  }, [isLoaded]) // eslint-disable-line react-hooks/exhaustive-deps

  const currentSetQueue = queue[queueIndex]
  const currentDueChunk = currentSetQueue?.dueChunks[chunkIndex]
  const currentChunkObj = currentSetQueue?.set.chunks.find((c) => c.id === currentDueChunk?.chunk_id)

  const handleSelfRate = useCallback(async (grade: SRSGrade) => {
    if (!currentSetQueue || !currentDueChunk) return
    const score = GRADE_SCORES[grade]
    const result = await upsertChunkProgress(currentSetQueue.set.id, currentDueChunk.chunk_id, score)
    if (result) setLastFeedback({ grade: result.grade, score, nextReviewAt: result.nextReviewAt })
    setMode("chunk-feedback")
  }, [currentSetQueue, currentDueChunk, upsertChunkProgress])

  const handleFeedbackContinue = useCallback(() => {
    const next = chunkIndex + 1
    if (next < (currentSetQueue?.dueChunks.length ?? 0)) {
      setChunkIndex(next)
      setMode("chunk-show")
    } else {
      setMode("full-set-prompt")
    }
  }, [chunkIndex, currentSetQueue])

  const advanceToNextSet = useCallback(() => {
    setCompletedSets((n) => n + 1)
    const next = queueIndex + 1
    if (next < queue.length) {
      setQueueIndex(next)
      setChunkIndex(0)
      setMode("queue-overview")
    } else {
      setMode("complete")
    }
  }, [queueIndex, queue.length])

  if (mode === "loading") {
    return (
      <div className="flex min-h-svh flex-col">
        <Header title="Today's Practice" showBack onBack={() => router.push("/")} />
        <div className="flex flex-1 items-center justify-center"><Spinner /></div>
      </div>
    )
  }

  if (mode === "complete") {
    return (
      <div className="flex min-h-svh flex-col">
        <Header title="Today's Practice" showBack onBack={() => router.push("/")} />
        <main className="flex flex-1 flex-col items-center justify-center gap-6 p-6">
          <div className="flex size-20 items-center justify-center rounded-full bg-primary/10">
            <Trophy className="size-10 text-primary" />
          </div>
          <div className="flex flex-col items-center gap-2 text-center">
            <h2 className="text-2xl font-bold">All caught up!</h2>
            <p className="text-muted-foreground">
              {completedSets > 0
                ? `You reviewed ${completedSets} set${completedSets !== 1 ? "s" : ""}. Great work.`
                : "No reviews due right now. Check back later."}
            </p>
          </div>
          <Button onClick={() => router.push("/")} className="w-full max-w-xs">
            Back to Library
          </Button>
        </main>
      </div>
    )
  }

  // Show chunk (hidden — recall from memory)
  if (mode === "chunk-show" && currentChunkObj && currentSetQueue) {
    return (
      <div className="flex min-h-svh flex-col">
        <Header title={currentSetQueue.set.title} showBack onBack={() => router.push("/")} />
        <main className="flex flex-1 flex-col gap-4 p-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{currentSetQueue.set.title}</span>
            <span>{chunkIndex + 1} / {currentSetQueue.dueChunks.length}</span>
          </div>

          <Card className="flex-1">
            <CardContent className="flex flex-1 flex-col items-center justify-center gap-6 py-12 px-6 text-center">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Recall this chunk</p>
              <div className="flex flex-col gap-3 w-full">
                {/* First letter hint */}
                <p className="font-mono text-2xl font-bold tracking-widest text-primary">
                  {currentChunkObj.text.split(/\s+/).filter(Boolean).map(w => w[0]?.toUpperCase() ?? "").join(" ")}
                </p>
                <p className="text-xs text-muted-foreground">First letters only — try to recall the full text</p>
              </div>
            </CardContent>
          </Card>

          <Button onClick={() => setMode("chunk-reveal")} className="w-full gap-2">
            <Eye className="size-4" />
            Reveal Answer
          </Button>
        </main>
      </div>
    )
  }

  // Reveal chunk + self-rate
  if (mode === "chunk-reveal" && currentChunkObj && currentSetQueue) {
    return (
      <div className="flex min-h-svh flex-col">
        <Header title={currentSetQueue.set.title} showBack onBack={() => router.push("/")} />
        <main className="flex flex-1 flex-col gap-4 p-4 pb-8">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{currentSetQueue.set.title}</span>
            <span>{chunkIndex + 1} / {currentSetQueue.dueChunks.length}</span>
          </div>

          <Card>
            <CardContent className="py-6 px-5">
              <p className="text-base leading-7 whitespace-pre-wrap">{currentChunkObj.text}</p>
            </CardContent>
          </Card>

          <p className="text-center text-sm font-medium text-muted-foreground">How well did you recall it?</p>

          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => handleSelfRate("fail")}
              className="flex flex-col items-center gap-2 rounded-2xl border-2 border-red-200 bg-red-50 p-4 transition-all active:scale-95 dark:border-red-800 dark:bg-red-900/20"
            >
              <XCircle className="size-6 text-red-500" />
              <span className="text-xs font-semibold text-red-700 dark:text-red-400">Missed</span>
            </button>
            <button
              onClick={() => handleSelfRate("medium")}
              className="flex flex-col items-center gap-2 rounded-2xl border-2 border-amber-200 bg-amber-50 p-4 transition-all active:scale-95 dark:border-amber-800 dark:bg-amber-900/20"
            >
              <AlertTriangle className="size-6 text-amber-500" />
              <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">Almost</span>
            </button>
            <button
              onClick={() => handleSelfRate("perfect")}
              className="flex flex-col items-center gap-2 rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-4 transition-all active:scale-95 dark:border-emerald-800 dark:bg-emerald-900/20"
            >
              <CheckCircle2 className="size-6 text-emerald-500" />
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Got it</span>
            </button>
          </div>
        </main>
      </div>
    )
  }

  // Chunk feedback
  if (mode === "chunk-feedback" && lastFeedback && currentSetQueue) {
    return (
      <div className="flex min-h-svh flex-col">
        <Header title={currentSetQueue.set.title} showBack onBack={() => router.push("/")} />
        <main className="flex flex-1 flex-col gap-4 p-4">
          {showSRToggle && (
            <SRToggle
              mode={currentSetQueue.set.repetitionMode}
              config={currentSetQueue.set.repetitionConfig}
              onModeChange={(m, c) => { updateRepetitionMode(currentSetQueue.set.id, m, c); setShowSRToggle(false) }}
            />
          )}
          <ReviewFeedbackCard
            grade={lastFeedback.grade}
            score={lastFeedback.score}
            nextReviewAt={lastFeedback.nextReviewAt}
            onContinue={handleFeedbackContinue}
            onAdjustSchedule={() => setShowSRToggle((v) => !v)}
          />
        </main>
      </div>
    )
  }

  // Full set prompt
  if (mode === "full-set-prompt" && currentSetQueue) {
    return (
      <div className="flex min-h-svh flex-col">
        <Header title={currentSetQueue.set.title} showBack onBack={() => router.push("/")} />
        <main className="flex flex-1 flex-col items-center justify-center gap-6 p-6">
          <div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
            <CheckCircle2 className="size-8 text-primary" />
          </div>
          <div className="flex flex-col gap-2 text-center">
            <h2 className="text-xl font-bold">Weak chunks reviewed!</h2>
            <p className="text-sm text-muted-foreground">Practice the full selection to solidify your memory.</p>
          </div>
          <div className="flex w-full max-w-xs flex-col gap-3">
            <Button
              onClick={() => router.push(`/memorization/${currentSetQueue.set.id}?mode=chunk-select`)}
              className="w-full gap-2"
            >
              <Layers className="size-4" />
              Practice Full Set
            </Button>
            <Button variant="outline" onClick={advanceToNextSet} className="w-full gap-2">
              <ArrowRight className="size-4" />
              Skip to Next
            </Button>
          </div>
        </main>
      </div>
    )
  }

  // Queue overview
  if (!currentSetQueue) return null
  const totalDue = queue.reduce((sum, q) => sum + q.dueChunks.length, 0)

  return (
    <div className="flex min-h-svh flex-col">
      <Header title="Today's Practice" showBack onBack={() => router.push("/")} />
      <main className="flex flex-1 flex-col gap-5 p-4">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{queueIndex + 1} of {queue.length} set{queue.length !== 1 ? "s" : ""}</span>
          <span>{totalDue} chunk{totalDue !== 1 ? "s" : ""} due</span>
        </div>

        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="flex flex-col gap-3 p-5">
            <h2 className="font-semibold text-lg leading-tight">{currentSetQueue.set.title}</h2>
            <p className="text-sm text-muted-foreground">
              {currentSetQueue.dueChunks.length} chunk{currentSetQueue.dueChunks.length !== 1 ? "s" : ""} due for review
            </p>
            <Button onClick={() => setMode("chunk-show")} className="w-full gap-2">
              <RotateCcw className="size-4" />
              Start Review
            </Button>
          </CardContent>
        </Card>

        {queue.slice(queueIndex + 1).length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Up next</p>
            {queue.slice(queueIndex + 1).map((item) => (
              <div key={item.set.id} className="flex items-center justify-between rounded-xl bg-muted/40 px-4 py-3">
                <span className="text-sm font-medium truncate flex-1">{item.set.title}</span>
                <span className="text-xs text-muted-foreground ml-2 shrink-0">{item.dueChunks.length} due</span>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
