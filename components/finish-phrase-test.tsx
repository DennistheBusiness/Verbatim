"use client"

import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { parseWords, type ParsedWord } from "@/lib/text-utils"
import {
  Check,
  X,
  RotateCcw,
  Trophy,
  TrendingUp,
  BookOpen,
  Play,
  Lightbulb,
  Timer,
  ChevronRight,
  Info,
  Shuffle,
  List,
  LogOut,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useSetActions, type Chunk } from "@/lib/memorization-context"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { hapticError, hapticSuccess } from "@/lib/haptics"

interface FinishPhraseTestProps {
  setId: string
  chunks: Chunk[]
  onBack: () => void
}

type WordState = "visible" | "hidden" | "active" | "revealed" | "error" | "timeout"
type ChunkOrder = "succession" | "random"

interface WordStatus {
  word: ParsedWord
  state: WordState
  wasIncorrect: boolean
}

interface ChunkResult {
  chunkIndex: number
  queuePos: number
  accuracy: number
  passed: boolean
  timeExpired: boolean
  correct: number
  wrong: number
}

interface SavedState {
  chunkQueue: number[]
  chunkQueuePos: number
  chunkResults: ChunkResult[]
  totalCorrect: number
  totalWrong: number
  chunkOrder: ChunkOrder
}

function getFeedback(accuracy: number): { label: string; color: string; icon: React.ReactNode } {
  if (accuracy >= 90)
    return { label: "Excellent recall", color: "text-green-600 dark:text-green-400", icon: <Trophy className="size-5" /> }
  if (accuracy >= 75)
    return { label: "Strong progress", color: "text-blue-600 dark:text-blue-400", icon: <TrendingUp className="size-5" /> }
  return { label: "Needs more review", color: "text-amber-600 dark:text-amber-400", icon: <BookOpen className="size-5" /> }
}

function formatTime(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`
}

const RING_R = 48
const RING_C = 2 * Math.PI * RING_R

function TimerRing({ timeLeft, totalTime }: { timeLeft: number; totalTime: number }) {
  const pct = totalTime > 0 ? timeLeft / totalTime : 1
  const offset = RING_C * (1 - pct)
  const isRed = pct <= 0.15
  const isAmber = pct <= 0.33 && !isRed

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative flex items-center justify-center">
        <svg width="120" height="120" className="-rotate-90">
          <circle cx="60" cy="60" r={RING_R} fill="none" strokeWidth="8" className="stroke-muted" />
          <circle
            cx="60"
            cy="60"
            r={RING_R}
            fill="none"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={RING_C}
            strokeDashoffset={offset}
            className={cn(
              "transition-all duration-1000",
              isRed ? "stroke-red-500" : isAmber ? "stroke-amber-400" : "stroke-green-500"
            )}
          />
        </svg>
        <span
          className={cn(
            "absolute text-3xl font-bold tabular-nums",
            isRed ? "text-red-600" : isAmber ? "text-amber-600" : "text-foreground"
          )}
        >
          {formatTime(timeLeft)}
        </span>
      </div>
      <p className="text-xs text-muted-foreground">time remaining</p>
    </div>
  )
}

function WordBlock({ status, gameStarted }: { status: WordStatus; gameStarted: boolean }) {
  if (status.state === "visible") {
    if (!gameStarted) {
      return (
        <span
          className="inline-flex items-center justify-center rounded border border-dashed border-muted-foreground/20 bg-muted/20 select-none"
          style={{ minWidth: `${Math.max(1.5, status.word.word.length * 0.55)}rem`, height: "1.625rem" }}
        />
      )
    }
    return (
      <span className="inline-flex items-center rounded bg-primary/10 px-1.5 py-0.5 text-sm font-medium text-primary">
        {status.word.word}
      </span>
    )
  }
  if (status.state === "hidden") {
    return (
      <span
        className="inline-flex items-center justify-center rounded border border-dashed border-muted-foreground/30 bg-muted/30 select-none"
        style={{ minWidth: `${Math.max(1.5, status.word.word.length * 0.55)}rem`, height: "1.625rem" }}
      />
    )
  }
  if (status.state === "active") {
    return (
      <span
        className="inline-flex animate-pulse items-center justify-center rounded border-2 border-primary bg-primary/10 select-none"
        style={{ minWidth: `${Math.max(1.5, status.word.word.length * 0.55)}rem`, height: "1.625rem" }}
      />
    )
  }
  if (status.state === "error") {
    return (
      <span className="inline-flex items-center rounded border-2 border-red-500 bg-red-50 px-1.5 py-0.5 text-sm font-medium text-red-600 dark:bg-red-950 dark:text-red-400">
        {status.word.word}
      </span>
    )
  }
  if (status.state === "timeout") {
    return (
      <span className="inline-flex items-center rounded bg-muted px-1.5 py-0.5 text-sm text-muted-foreground line-through">
        {status.word.word}
      </span>
    )
  }
  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-1.5 py-0.5 text-sm font-medium",
        status.wasIncorrect
          ? "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400"
          : "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400"
      )}
    >
      {status.word.word}
    </span>
  )
}

function saveKey(setId: string) { return `finish-phrase-${setId}` }

function loadSavedState(setId: string): SavedState | null {
  try {
    const raw = sessionStorage.getItem(saveKey(setId))
    return raw ? (JSON.parse(raw) as SavedState) : null
  } catch { return null }
}

function clearSavedState(setId: string) {
  try { sessionStorage.removeItem(saveKey(setId)) } catch {}
}

function persistState(setId: string, state: SavedState) {
  try { sessionStorage.setItem(saveKey(setId), JSON.stringify(state)) } catch {}
}

export function FinishPhraseTest({ setId, chunks, onBack }: FinishPhraseTestProps) {
  const { updateTestScore } = useSetActions()

  const [showIntro, setShowIntro] = useState(true)
  const [chunkOrder, setChunkOrder] = useState<ChunkOrder>("succession")
  const savedState = useMemo(() => loadSavedState(setId), [setId])

  const [chunkQueue, setChunkQueue] = useState<number[]>([])
  const [chunkQueuePos, setChunkQueuePos] = useState(0)
  const [chunkResults, setChunkResults] = useState<ChunkResult[]>([])
  const [phase, setPhase] = useState<"playing" | "transitioning" | "chunk-complete" | "results">("playing")
  const [totalCorrect, setTotalCorrect] = useState(0)
  const [totalWrong, setTotalWrong] = useState(0)
  const [pendingChunkResult, setPendingChunkResult] = useState<ChunkResult | null>(null)

  const [words, setWords] = useState<WordStatus[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [chunkCorrect, setChunkCorrect] = useState(0)
  const [chunkWrong, setChunkWrong] = useState(0)
  const [timeLeft, setTimeLeft] = useState(0)
  const [totalTime, setTotalTime] = useState(0)
  const [hasStarted, setHasStarted] = useState(false)
  const [mobileValue, setMobileValue] = useState("")
  const [isMobile, setIsMobile] = useState(false)

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const lockedRef = useRef(false)
  const activeIndexRef = useRef(0)
  const wordCountRef = useRef(0)
  const chunkCorrectRef = useRef(0)
  const chunkWrongRef = useRef(0)
  const hasSavedRef = useRef(false)
  const isMobileRef = useRef(false)
  const hasStartedRef = useRef(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const lastInputRef = useRef<{ key: string; index: number; ts: number } | null>(null)
  const chunkQueueRef = useRef<number[]>([])
  const chunkQueuePosRef = useRef(0)
  const chunkResultsRef = useRef<ChunkResult[]>([])
  const totalCorrectRef = useRef(0)
  const totalWrongRef = useRef(0)
  const chunkOrderRef = useRef<ChunkOrder>("succession")

  useEffect(() => {
    const mobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    isMobileRef.current = mobile
    setIsMobile(mobile)
  }, [])
  useEffect(() => { activeIndexRef.current = activeIndex }, [activeIndex])
  useEffect(() => { chunkCorrectRef.current = chunkCorrect }, [chunkCorrect])
  useEffect(() => { chunkWrongRef.current = chunkWrong }, [chunkWrong])
  useEffect(() => { hasStartedRef.current = hasStarted }, [hasStarted])
  useEffect(() => { chunkQueueRef.current = chunkQueue }, [chunkQueue])
  useEffect(() => { chunkQueuePosRef.current = chunkQueuePos }, [chunkQueuePos])
  useEffect(() => { chunkResultsRef.current = chunkResults }, [chunkResults])
  useEffect(() => { totalCorrectRef.current = totalCorrect }, [totalCorrect])
  useEffect(() => { totalWrongRef.current = totalWrong }, [totalWrong])
  useEffect(() => { chunkOrderRef.current = chunkOrder }, [chunkOrder])

  // Scroll bottom into view on mobile whenever active word advances
  useEffect(() => {
    if (isMobileRef.current && hasStartedRef.current) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 50)
    }
  }, [activeIndex])

  const initChunk = useCallback((queue: number[], pos: number, autoStart = false) => {
    const realIdx = queue[pos]
    if (realIdx === undefined || realIdx >= chunks.length) return
    const chunk = chunks[realIdx]
    const parsed = parseWords(chunk.text)
    if (parsed.length === 0) return

    const revealCount = Math.max(1, Math.ceil(parsed.length * 0.2))
    const hiddenCount = parsed.length - revealCount
    const secondsForChunk = hiddenCount * 2

    const initialWords: WordStatus[] = parsed.map((w, i) => ({
      word: w,
      state: i < revealCount ? "visible" : i === revealCount ? "active" : "hidden",
      wasIncorrect: false,
    }))

    setWords(initialWords)
    setActiveIndex(revealCount)
    activeIndexRef.current = revealCount
    wordCountRef.current = parsed.length
    setChunkCorrect(0)
    setChunkWrong(0)
    chunkCorrectRef.current = 0
    chunkWrongRef.current = 0
    setTimeLeft(secondsForChunk)
    setTotalTime(secondsForChunk)
    lockedRef.current = false
    lastInputRef.current = null
    setHasStarted(autoStart)
    hasStartedRef.current = autoStart
  }, [chunks])

  useEffect(() => {
    if (phase !== "playing") return
    if (!hasStarted) {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null }
      return
    }
    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!)
          intervalRef.current = null
          handleTimeExpired()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasStarted, phase])

  const handleTimeExpired = useCallback(() => {
    setWords((prev) => {
      let extraWrong = 0
      const next = prev.map((w) => {
        if (w.state === "hidden" || w.state === "active") {
          extraWrong++
          return { ...w, state: "timeout" as WordState, wasIncorrect: true }
        }
        return w
      })
      const newWrong = chunkWrongRef.current + extraWrong
      chunkWrongRef.current = newWrong
      setChunkWrong(newWrong)
      setTimeout(() => finalizeChunk(chunkCorrectRef.current, newWrong, true), 500)
      return next
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const finalizeChunk = useCallback((correct: number, wrong: number, timeExpired = false) => {
    const total = correct + wrong
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0
    const passed = accuracy === 100
    const pos = chunkQueuePosRef.current
    const realIdx = chunkQueueRef.current[pos] ?? pos
    const result: ChunkResult = { chunkIndex: realIdx, queuePos: pos, accuracy, passed, timeExpired, correct, wrong }
    setChunkResults((prev) => [...prev, result])
    setTotalCorrect((t) => t + correct)
    setTotalWrong((t) => t + wrong)
    setPendingChunkResult(result)
    setPhase("chunk-complete")
  }, [])

  const handleNextChunk = useCallback(() => {
    const nextPos = chunkQueuePosRef.current + 1
    if (nextPos >= chunkQueueRef.current.length) {
      clearSavedState(setId)
      hapticSuccess()
      setPhase("results")
    } else {
      setChunkQueuePos(nextPos)
      chunkQueuePosRef.current = nextPos
      setPhase("transitioning")
      setTimeout(() => {
        initChunk(chunkQueueRef.current, nextPos, false)
        setPhase("playing")
      }, 80)
    }
  }, [setId, initChunk])

  const handleRetryChunk = useCallback(() => {
    setChunkResults((prev) => prev.slice(0, -1))
    setTotalCorrect((t) => t - (pendingChunkResult?.correct ?? 0))
    setTotalWrong((t) => t - (pendingChunkResult?.wrong ?? 0))
    setPendingChunkResult(null)
    initChunk(chunkQueueRef.current, chunkQueuePosRef.current, false)
    setPhase("playing")
  }, [initChunk, pendingChunkResult])

  const handlePauseAndSave = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null }
    persistState(setId, {
      chunkQueue: chunkQueueRef.current,
      chunkQueuePos: chunkQueuePosRef.current,
      chunkResults: chunkResultsRef.current,
      totalCorrect: totalCorrectRef.current,
      totalWrong: totalWrongRef.current,
      chunkOrder: chunkOrderRef.current,
    })
    toast.success("Progress saved - resume any time from the Train menu")
    onBack()
  }, [setId, onBack])

  const processLetterInput = useCallback((rawKey: string) => {
    if (phase !== "playing") return
    if (lockedRef.current) return
    if (!hasStartedRef.current) return
    const key = rawKey.toLowerCase()
    if (!/^[a-z&]$/.test(key)) return
    const idx = activeIndexRef.current
    const now = Date.now()
    const last = lastInputRef.current
    if (last && last.key === key && last.index === idx && now - last.ts < 90) return
    lastInputRef.current = { key, index: idx, ts: now }

    setWords((prev) => {
      const currentWord = prev[idx]
      if (!currentWord || currentWord.state !== "active") return prev
      if (key === currentWord.word.firstLetter) {
        const newCorrect = chunkCorrectRef.current + 1
        chunkCorrectRef.current = newCorrect
        setChunkCorrect(newCorrect)
        const next = idx + 1
        const allDone = next >= wordCountRef.current
        if (allDone) {
          setTimeout(() => finalizeChunk(chunkCorrectRef.current, chunkWrongRef.current, false), 0)
          return prev.map((w, i) => i === idx ? { ...w, state: "revealed" as WordState } : w)
        }
        activeIndexRef.current = next
        setActiveIndex(next)
        return prev.map((w, i) => {
          if (i === idx) return { ...w, state: "revealed" as WordState }
          if (i === next) return { ...w, state: "active" as WordState }
          return w
        })
      } else {
        hapticError()
        lockedRef.current = true
        const newWrong = chunkWrongRef.current + 1
        chunkWrongRef.current = newWrong
        setChunkWrong(newWrong)
        setTimeout(() => {
          const next = idx + 1
          const allDone = next >= wordCountRef.current
          setWords((p) =>
            p.map((w, i) => {
              if (i === idx) return { ...w, state: "revealed" as WordState, wasIncorrect: true }
              if (!allDone && i === next) return { ...w, state: "active" as WordState }
              return w
            })
          )
          if (allDone) {
            setTimeout(() => finalizeChunk(chunkCorrectRef.current, chunkWrongRef.current, false), 0)
          } else {
            activeIndexRef.current = next
            setActiveIndex(next)
          }
          lockedRef.current = false
        }, 600)
        return prev.map((w, i) =>
          i === idx ? { ...w, state: "error" as WordState, wasIncorrect: true } : w
        )
      }
    })
  }, [phase, finalizeChunk])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!isMobileRef.current && hasStartedRef.current) processLetterInput(e.key)
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [processLetterInput])

  const handleMobileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setMobileValue("")
    if (!val) return
    const letter = val.replace(/[^a-zA-Z&]/g, "").slice(-1)
    if (letter) processLetterInput(letter)
  }, [processLetterInput])

  const handleHint = useCallback(() => {
    if (phase !== "playing" || lockedRef.current) return
    const idx = activeIndexRef.current
    const newWrong = chunkWrongRef.current + 1
    chunkWrongRef.current = newWrong
    setChunkWrong(newWrong)
    const next = idx + 1
    const allDone = next >= wordCountRef.current
    setWords((prev) =>
      prev.map((w, i) => {
        if (i === idx) return { ...w, state: "revealed" as WordState, wasIncorrect: true }
        if (!allDone && i === next) return { ...w, state: "active" as WordState }
        return w
      })
    )
    if (allDone) {
      setTimeout(() => finalizeChunk(chunkCorrectRef.current, chunkWrongRef.current, false), 0)
    } else {
      activeIndexRef.current = next
      setActiveIndex(next)
    }
  }, [phase, finalizeChunk])

  const buildQueue = (order: ChunkOrder) =>
    order === "random"
      ? [...chunks.map((_, i) => i)].sort(() => Math.random() - 0.5)
      : chunks.map((_, i) => i)

  const handleStartNew = useCallback(() => {
    clearSavedState(setId)
    const queue = buildQueue(chunkOrder)
    setChunkQueue(queue)
    chunkQueueRef.current = queue
    setChunkQueuePos(0)
    chunkQueuePosRef.current = 0
    setChunkResults([])
    chunkResultsRef.current = []
    setTotalCorrect(0)
    totalCorrectRef.current = 0
    setTotalWrong(0)
    totalWrongRef.current = 0
    setPendingChunkResult(null)
    hasSavedRef.current = false
    setShowIntro(false)
    initChunk(queue, 0, false)
    setPhase("playing")
  }, [setId, chunkOrder, initChunk]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleResume = useCallback(() => {
    if (!savedState) return
    const { chunkQueue: q, chunkQueuePos: pos, chunkResults: cr, totalCorrect: tc, totalWrong: tw, chunkOrder: co } = savedState
    clearSavedState(setId)
    setChunkQueue(q)
    chunkQueueRef.current = q
    setChunkQueuePos(pos)
    chunkQueuePosRef.current = pos
    setChunkResults(cr)
    chunkResultsRef.current = cr
    setTotalCorrect(tc)
    totalCorrectRef.current = tc
    setTotalWrong(tw)
    totalWrongRef.current = tw
    setChunkOrder(co)
    chunkOrderRef.current = co
    setPendingChunkResult(null)
    hasSavedRef.current = false
    setShowIntro(false)
    initChunk(q, pos, false)
    setPhase("playing")
  }, [savedState, setId, initChunk])

  useEffect(() => {
    if (phase === "results" && !hasSavedRef.current) {
      hasSavedRef.current = true
      const total = totalCorrect + totalWrong
      const accuracy = total > 0 ? Math.round((totalCorrect / total) * 100) : 0
      updateTestScore(setId, "finishPhrase", accuracy, { totalWords: total, correctWords: totalCorrect })
      toast.success("Progress saved")
    }
  }, [phase]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleRetry = useCallback(() => {
    hasSavedRef.current = false
    const queue = buildQueue(chunkOrderRef.current)
    setChunkQueue(queue)
    chunkQueueRef.current = queue
    setChunkQueuePos(0)
    chunkQueuePosRef.current = 0
    setChunkResults([])
    chunkResultsRef.current = []
    setTotalCorrect(0)
    totalCorrectRef.current = 0
    setTotalWrong(0)
    totalWrongRef.current = 0
    setPendingChunkResult(null)
    initChunk(queue, 0, true)
    setPhase("playing")
  }, [initChunk]) // eslint-disable-line react-hooks/exhaustive-deps

  const totalChunks = chunkQueue.length || chunks.length
  const hiddenTotal = words.filter((w) => w.state === "hidden" || w.state === "active").length

  // Intro dialog
  if (showIntro) {
    return (
      <div className="flex flex-col gap-5">
        <Dialog open onOpenChange={(open) => { if (!open) onBack() }}>
          <DialogContent className="max-w-sm gap-0 p-0 overflow-hidden" onInteractOutside={(e) => e.preventDefault()}>
            <DialogHeader className="px-6 pt-6 pb-4 border-b">
              <DialogTitle className="flex items-center gap-2">
                <Info className="size-5 text-primary" />
                Finish That Phrase
              </DialogTitle>
            </DialogHeader>

            <div className="flex flex-col gap-5 px-6 py-5">
              <div className="flex flex-col gap-3 text-sm text-muted-foreground">
                {[
                  ["1", "See the start", "the first 20% of each chunk is shown as a prompt."],
                  ["2", "Type first letters", "blank boxes show missing words. Press the first letter of each to reveal it."],
                  ["3", "Beat the clock", "2 seconds per hidden word. Timer starts when you tap Start Game."],
                  ["4", "Hints cost 1 wrong", "a chunk only passes at 100%."],
                ].map(([num, title, body]) => (
                  <div key={num} className="flex gap-3">
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{num}</span>
                    <p><span className="font-medium text-foreground">{title}</span> - {body}</p>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Chunk Order</p>
                <div className="grid grid-cols-2 gap-2">
                  {(["succession", "random"] as ChunkOrder[]).map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setChunkOrder(opt)}
                      className={cn(
                        "flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 text-sm font-medium transition-colors",
                        chunkOrder === opt
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border text-muted-foreground hover:border-muted-foreground"
                      )}
                    >
                      {opt === "succession" ? <List className="size-5" /> : <Shuffle className="size-5" />}
                      {opt === "succession" ? "In Order" : "Random"}
                    </button>
                  ))}
                </div>
              </div>

              {savedState && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800 dark:bg-amber-950/30">
                  <p className="text-sm font-medium text-amber-700 dark:text-amber-400">Saved session found</p>
                  <p className="mt-0.5 text-xs text-amber-600/80">
                    Chunk {savedState.chunkQueuePos + 1} of {savedState.chunkQueue.length} · {savedState.totalCorrect}✓ {savedState.totalWrong}✗ so far
                  </p>
                  <Button size="sm" className="mt-3 w-full gap-2" onClick={handleResume}>
                    <Play className="size-3.5" />
                    Resume Session
                  </Button>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 px-6 pb-6">
              <Button className="w-full gap-2" onClick={handleStartNew}>
                <ChevronRight className="size-4" />
                Start Game
              </Button>
              {savedState && (
                <p className="text-center text-xs text-muted-foreground">Starting new game will discard saved session</p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  // Chunk-complete
  if (phase === "chunk-complete" && pendingChunkResult) {
    const r = pendingChunkResult
    const isLastChunk = chunkQueuePos + 1 >= totalChunks
    const { label, color, icon } = getFeedback(r.accuracy)
    return (
      <div className="flex flex-col gap-5">
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-8">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Chunk {chunkQueuePos + 1} of {totalChunks}
            </p>
            {r.timeExpired && (
              <Badge variant="outline" className="gap-1 text-amber-600">
                <Timer className="size-3" /> Timed out
              </Badge>
            )}
            <div className={cn("flex items-center gap-2 text-lg font-semibold", color)}>
              {icon}<span>{label}</span>
            </div>
            <div className="text-5xl font-bold">{r.accuracy}%</div>
            <div className="flex gap-3">
              <Badge variant="outline" className="gap-1.5 border-green-300 text-green-700 dark:text-green-400">
                <Check className="size-3.5" />{r.correct} correct
              </Badge>
              <Badge variant="outline" className="gap-1.5 border-red-300 text-red-700 dark:text-red-400">
                <X className="size-3.5" />{r.wrong} wrong
              </Badge>
            </div>
            {r.passed ? (
              <Badge className="gap-1 bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400">
                <Check className="size-3" /> Perfect - chunk passed!
              </Badge>
            ) : (
              <Badge className="gap-1 bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400">
                <X className="size-3" /> Chunk failed
              </Badge>
            )}
          </CardContent>
        </Card>
        <div className="flex flex-col gap-3">
          <Button className="w-full gap-2" onClick={handleNextChunk}>
            <ChevronRight className="size-4" />
            {isLastChunk ? "See Results" : "Next Chunk"}
          </Button>
          <Button variant="outline" className="w-full gap-2" onClick={handleRetryChunk}>
            <RotateCcw className="size-4" />
            Retry This Chunk
          </Button>
        </div>
      </div>
    )
  }

  // Results
  if (phase === "results") {
    const total = totalCorrect + totalWrong
    const accuracy = total > 0 ? Math.round((totalCorrect / total) * 100) : 0
    const { label, color, icon } = getFeedback(accuracy)
    return (
      <div className="flex flex-col gap-6">
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-8">
            <div className={cn("flex items-center gap-2 text-lg font-semibold", color)}>{icon}<span>{label}</span></div>
            <div className="text-5xl font-bold">{accuracy}%</div>
            <div className="flex gap-3">
              <Badge variant="outline" className="gap-1.5 border-green-300 text-green-700 dark:text-green-400">
                <Check className="size-3.5" />{totalCorrect} correct
              </Badge>
              <Badge variant="outline" className="gap-1.5 border-red-300 text-red-700 dark:text-red-400">
                <X className="size-3.5" />{totalWrong} wrong
              </Badge>
            </div>
          </CardContent>
        </Card>
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-muted-foreground">Chunk Breakdown</p>
          {chunkResults.map((r, i) => (
            <div key={i} className="flex items-center justify-between rounded-lg border bg-card px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-muted-foreground">Chunk {r.chunkIndex + 1}</span>
                {r.timeExpired && (
                  <Badge variant="outline" className="gap-1 text-xs text-amber-600">
                    <Timer className="size-3" /> Timed out
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm tabular-nums">{r.accuracy}%</span>
                {r.passed ? (
                  <Badge className="gap-1 bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400">
                    <Check className="size-3" /> Pass
                  </Badge>
                ) : (
                  <Badge className="gap-1 bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400">
                    <X className="size-3" /> Fail
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-3">
          <Button onClick={handleRetry} className="w-full gap-2">
            <RotateCcw className="size-4" />
            Try Again
          </Button>
          <Button variant="outline" onClick={onBack} className="w-full">Done</Button>
        </div>
      </div>
    )
  }

  // Playing
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">Chunk {chunkQueuePos + 1} of {totalChunks}</span>
          {chunkOrder === "random" && (
            <Badge variant="outline" className="gap-1 text-xs">
              <Shuffle className="size-3" /> Random
            </Badge>
          )}
        </div>
        <Button
          size="sm"
          variant="outline"
          className="h-8 gap-1.5 px-3 text-xs"
          onClick={handlePauseAndSave}
          disabled={!hasStarted}
        >
          <LogOut className="size-3.5" />
          Pause &amp; Save
        </Button>
      </div>

      <div className="flex flex-col items-center rounded-2xl border bg-card py-6">
        <TimerRing timeLeft={timeLeft} totalTime={totalTime} />
        <div className="mt-4 flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="flex size-6 items-center justify-center rounded-full bg-green-100 dark:bg-green-950">
              <Check className="size-3.5 text-green-600 dark:text-green-400" />
            </span>
            <span className="text-lg font-bold text-green-700 dark:text-green-400">{chunkCorrect}</span>
          </div>
          <span className="text-muted-foreground">·</span>
          <div className="flex items-center gap-1.5">
            <span className="flex size-6 items-center justify-center rounded-full bg-red-100 dark:bg-red-950">
              <X className="size-3.5 text-red-600 dark:text-red-400" />
            </span>
            <span className="text-lg font-bold text-red-700 dark:text-red-400">{chunkWrong}</span>
          </div>
          <span className="ml-2 text-xs text-muted-foreground">{hiddenTotal} word{hiddenTotal !== 1 ? "s" : ""} left</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 rounded-xl border bg-card p-4">
        {words.map((status, i) => (
          <WordBlock key={i} status={status} gameStarted={hasStarted} />
        ))}
      </div>

      <Button
        variant="outline"
        size="sm"
        className="w-full gap-2 text-xs text-muted-foreground"
        onClick={handleHint}
        disabled={activeIndex >= words.length}
      >
        <Lightbulb className="size-3.5" />
        Hint - reveal next word (+1 wrong)
      </Button>

      {!hasStarted && (
        <Button
          className="w-full gap-2"
          onClick={() => {
            setHasStarted(true)
            hasStartedRef.current = true
            if (isMobileRef.current) inputRef.current?.focus()
          }}
        >
          <ChevronRight className="size-4" />
          Start Game
        </Button>
      )}

      {isMobile && hasStarted && (
        <button
          onClick={() => inputRef.current?.focus()}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-muted-foreground/30 py-3 text-xs text-muted-foreground active:bg-muted/40"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M6 12h.01M10 12h.01M14 12h.01M18 12h.01M6 16h4M14 16h4"/></svg>
          Tap to open keyboard
        </button>
      )}

      <input
        ref={inputRef}
        className="sr-only"
        value={mobileValue}
        onChange={handleMobileChange}
        onFocus={() => {
          // After keyboard slides up, scroll bottom of content into view
          setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 350)
        }}
        aria-label="Letter input"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
      />
      <div ref={bottomRef} aria-hidden="true" className="h-[50vh]" />
    </div>
  )
}
