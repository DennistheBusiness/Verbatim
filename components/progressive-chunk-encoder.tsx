"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { parseWords, type ParsedWord } from "@/lib/text-utils"
import { Check, X, Trophy, ArrowRight, Sparkles, Target, Keyboard } from "lucide-react"
import { useMemorization } from "@/lib/memorization-context"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface ProgressiveChunkEncoderProps {
  setId: string
  chunkId?: string | null
  chunk: string
  chunkIndex: number
  totalChunks: number
  onRetryChunk?: () => void
  onNextChunk?: () => void
  onContinueToTest?: () => void
  onBackToDetail?: () => void
  hasNextChunk?: boolean
}

type Level = 1 | 2 | 3
type WordState = "hidden" | "active" | "revealed" | "error" | "shown"

interface WordStatus {
  word: ParsedWord
  state: WordState
  showError: boolean
  wasIncorrect: boolean
  isHiddenInLevel2: boolean
}

interface LevelResults {
  accuracy: number
  correctCount: number
  incorrectCount: number
}

export function ProgressiveChunkEncoder({
  setId,
  chunkId,
  chunk,
  chunkIndex,
  totalChunks,
  onRetryChunk,
  onNextChunk,
  onContinueToTest,
  onBackToDetail,
  hasNextChunk = false,
}: ProgressiveChunkEncoderProps) {
  const { updateEncodeProgress } = useMemorization()
  const [currentLevel, setCurrentLevel] = useState<Level>(1)
  const [words, setWords] = useState<WordStatus[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [incorrectCount, setIncorrectCount] = useState(0)
  const [isLevelComplete, setIsLevelComplete] = useState(false)
  const [mobileValue, setMobileValue] = useState("")
  const [hasStarted, setHasStarted] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Refs so the keydown handler always reads the latest values without stale closures
  const currentIndexRef = useRef(0)
  const lockedRef = useRef(false) // true during error display delay — blocks double-advance
  const wordsRef = useRef<WordStatus[]>([])
  const isLevelCompleteRef = useRef(false)
  const hasStartedRef = useRef(false)
  const isMobileRef = useRef(false)
  const lastInputRef = useRef<{ key: string; index: number; ts: number } | null>(null)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [topCtaVisible, setTopCtaVisible] = useState(true)
  const topCtaRef = useRef<HTMLButtonElement>(null)
  const activeWordRef = useRef<HTMLSpanElement>(null)
  const levelStartAtRef = useRef<number>(Date.now())
  const persistedLevelsRef = useRef<Set<Level>>(new Set())
  const [levelResults, setLevelResults] = useState<Record<Level, LevelResults | null>>({
    1: null,
    2: null,
    3: null,
  })

  const initializeLevel = useCallback(
    (level: Level) => {
      const parsed = parseWords(chunk)

      if (level === 1) {
        // Level 1: Show full text, type first letters
        setWords(
          parsed.map((word, i) => ({
            word,
            state: i === 0 ? ("active" as WordState) : ("shown" as WordState),
            showError: false,
            wasIncorrect: false,
            isHiddenInLevel2: false,
          }))
        )
        currentIndexRef.current = 0
        setCurrentIndex(0)
      } else if (level === 2) {
        // Level 2: 40-60% of words are blanked out as a challenge, but ALL words
        // must be typed. Non-hidden words show as amber hints; hidden ones are blank.
        const hidePercentage = 0.4 + Math.random() * 0.2
        const totalToHide = Math.max(1, Math.floor(parsed.length * hidePercentage))

        const hiddenIndices = new Set<number>()
        while (hiddenIndices.size < totalToHide) {
          hiddenIndices.add(Math.floor(Math.random() * parsed.length))
        }

        setWords(
          parsed.map((word, i) => ({
            word,
            state: i === 0 ? ("active" as WordState) : ("shown" as WordState),
            showError: false,
            wasIncorrect: false,
            isHiddenInLevel2: hiddenIndices.has(i),
          }))
        )
        currentIndexRef.current = 0
        setCurrentIndex(0)
      } else {
        // Level 3: All words hidden (original behavior)
        setWords(
          parsed.map((word, i) => ({
            word,
            state: i === 0 ? ("active" as WordState) : ("hidden" as WordState),
            showError: false,
            wasIncorrect: false,
            isHiddenInLevel2: false,
          }))
        )
        currentIndexRef.current = 0
        setCurrentIndex(0)
      }

      lockedRef.current = false
      lastInputRef.current = null
      levelStartAtRef.current = Date.now()
      setCorrectCount(0)
      setIncorrectCount(0)
      setIsLevelComplete(false)
      setHasStarted(false)
    },
    [chunk]
  )

  useEffect(() => {
    initializeLevel(currentLevel)
  }, [currentLevel, initializeLevel])

  useEffect(() => {
    persistedLevelsRef.current.clear()
  }, [setId, chunkId, chunk])

  // Keep refs in sync with state
  useEffect(() => { currentIndexRef.current = currentIndex }, [currentIndex])
  useEffect(() => { wordsRef.current = words }, [words])
  useEffect(() => { isLevelCompleteRef.current = isLevelComplete }, [isLevelComplete])
  useEffect(() => { hasStartedRef.current = hasStarted }, [hasStarted])

  useEffect(() => {
    isMobileRef.current = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
  }, [])

  // All levels advance sequentially through every word — stable ref, no deps
  const findNextWordToType = useCallback((fromIndex: number): number => fromIndex, [])

  const processLetterInput = useCallback(
    (rawKey: string) => {
      if (isLevelCompleteRef.current || wordsRef.current.length === 0) return
      if (lockedRef.current) return // blocked during error delay
      if (isMobileRef.current && !hasStartedRef.current) return

      const key = rawKey.toLowerCase()
      if (!/^[a-z]$/.test(key)) return

      const idx = currentIndexRef.current
      const now = Date.now()
      const last = lastInputRef.current
      if (last && last.key === key && last.index === idx && now - last.ts < 90) {
        return
      }
      lastInputRef.current = { key, index: idx, ts: now }

      const currentWord = wordsRef.current[idx]
      if (!currentWord) return

      if (key === currentWord.word.firstLetter) {
        // Correct — all side effects outside the updater to prevent Strict Mode double-fire
        setCorrectCount((c) => c + 1)
        const nextIndex = findNextWordToType(idx + 1)
        if (nextIndex >= wordsRef.current.length) {
          setIsLevelComplete(true)
        } else {
          currentIndexRef.current = nextIndex
          setCurrentIndex(nextIndex)
        }
        setWords((prev) =>
          prev.map((w, i) => {
            if (i === idx) return { ...w, state: "revealed" as WordState }
            if (i === nextIndex) return { ...w, state: "active" as WordState }
            return w
          })
        )
      } else {
        // Incorrect — lock input, show error, then advance after delay
        lockedRef.current = true
        setIncorrectCount((c) => c + 1)
        setWords((prev) =>
          prev.map((w, i) =>
            i === idx ? { ...w, state: "error" as WordState, showError: true, wasIncorrect: true } : w
          )
        )

        setTimeout(() => {
          const nextIndex = findNextWordToType(idx + 1)
          setWords((p) =>
            p.map((w, i) => {
              if (i === idx) return { ...w, state: "revealed" as WordState, showError: false, wasIncorrect: true }
              if (i === nextIndex) return { ...w, state: "active" as WordState }
              return w
            })
          )
          if (nextIndex >= wordsRef.current.length) {
            setIsLevelComplete(true)
          } else {
            currentIndexRef.current = nextIndex
            setCurrentIndex(nextIndex)
          }
          lockedRef.current = false
        }, 800)
      }
    },
    [findNextWordToType]
  )

  const handleWindowKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (isMobileRef.current) return
      if (e.isComposing || e.repeat || e.metaKey || e.ctrlKey || e.altKey) return
      processLetterInput(e.key)
    },
    [processLetterInput]
  )

  useEffect(() => {
    window.addEventListener("keydown", handleWindowKeyDown)
    return () => window.removeEventListener("keydown", handleWindowKeyDown)
  }, [handleWindowKeyDown])

  // Auto-focus the hidden input on desktop so keydown listeners work immediately.
  // Does NOT set hasStarted — that requires an explicit tap on the Start button.
  useEffect(() => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    if (!isLevelComplete && !isMobile) inputRef.current?.focus()
  }, [isLevelComplete])

  const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isMobileRef.current) {
      e.target.value = ""
      setMobileValue("")
      return
    }
    const val = e.target.value
    if (val.length > 0) {
      const firstLetter = val.toLowerCase().match(/[a-z]/)?.[0]
      if (firstLetter) processLetterInput(firstLetter)
    }
    e.target.value = ""
    setMobileValue("")
  }

  useEffect(() => {
    if (isLevelComplete) {
      const totalAttempts = correctCount + incorrectCount
      const accuracy = totalAttempts > 0 ? Math.round((correctCount / totalAttempts) * 100) : 0

      setLevelResults((prev) => ({
        ...prev,
        [currentLevel]: {
          accuracy,
          correctCount,
          incorrectCount,
        },
      }))

      setShowSuccessDialog(true)
    }
  }, [isLevelComplete, correctCount, incorrectCount, currentLevel])

  // Track whether the top Start Typing button is scrolled off screen
  useEffect(() => {
    const el = topCtaRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => setTopCtaVisible(entry.isIntersecting),
      { threshold: 0.1 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasStarted, isLevelComplete])

  // Keep the active word visible above the keyboard on mobile as the user progresses.
  useEffect(() => {
    if (!hasStarted || isLevelComplete || !isMobileRef.current) return
    const activeWordEl = activeWordRef.current
    if (!activeWordEl) return

    requestAnimationFrame(() => {
      activeWordEl.scrollIntoView({ block: "center", behavior: "smooth" })
    })
  }, [currentIndex, hasStarted, isLevelComplete, currentLevel])

  const persistLevelProgress = useCallback((level: Level, result: LevelResults) => {
    if (persistedLevelsRef.current.has(level)) return
    persistedLevelsRef.current.add(level)

    const totalWords = wordsRef.current.length > 0 ? wordsRef.current.length : parseWords(chunk).length
    const durationSeconds = Math.max(1, Math.round((Date.now() - levelStartAtRef.current) / 1000))

    updateEncodeProgress(setId, level, result.accuracy, {
      chunkId: chunkId ?? null,
      totalWords,
      correctWords: result.correctCount,
      durationSeconds,
    })
  }, [chunk, chunkId, setId, updateEncodeProgress])

  const handleContinueToNextLevel = () => {
    // Save progress for the completed level
    const completedLevelResult = levelResults[currentLevel]
    if (completedLevelResult) {
      persistLevelProgress(currentLevel, completedLevelResult)
      toast.success("Progress saved")
    }

    // Reset isLevelComplete in the same batch as currentLevel change so the
    // useEffect([isLevelComplete, ..., currentLevel]) doesn't re-fire with
    // the old completion state when currentLevel changes.
    setIsLevelComplete(false)
    setShowSuccessDialog(false)
    if (currentLevel < 3) {
      setCurrentLevel(((currentLevel + 1) as Level))
    }
  }

  const totalAttempts = correctCount + incorrectCount
  const accuracy = totalAttempts > 0 ? Math.round((correctCount / totalAttempts) * 100) : 0

  useEffect(() => {
    if (!isLevelComplete || currentLevel !== 3) return

    const completedLevelResult = {
      accuracy,
      correctCount,
      incorrectCount,
    }
    persistLevelProgress(3, completedLevelResult)
  }, [accuracy, correctCount, currentLevel, incorrectCount, isLevelComplete, persistLevelProgress])

  const handleRetryLevel = () => {
    setShowSuccessDialog(false)
    initializeLevel(currentLevel)
  }

  const getLevelDescription = (level: Level): string => {
    switch (level) {
      case 1:
        return "Show full text"
      case 2:
        return "Show text with random words missing"
      case 3:
        return "Show no text"
    }
  }

  const getLevelIcon = (level: Level) => {
    switch (level) {
      case 1:
        return <Sparkles className="size-4" />
      case 2:
        return <Target className="size-4" />
      case 3:
        return <Trophy className="size-4" />
    }
  }

  const getOverallStats = () => {
    const completedLevels = Object.values(levelResults).filter((r) => r !== null) as LevelResults[]
    if (completedLevels.length === 0) return null

    const totalCorrect = completedLevels.reduce((sum, r) => sum + r.correctCount, 0)
    const totalIncorrect = completedLevels.reduce((sum, r) => sum + r.incorrectCount, 0)
    const total = totalCorrect + totalIncorrect
    const overallAccuracy = total > 0 ? Math.round((totalCorrect / total) * 100) : 0

    return {
      accuracy: overallAccuracy,
      correctCount: totalCorrect,
      incorrectCount: totalIncorrect,
    }
  }

  const allLevelsComplete = currentLevel === 3 && isLevelComplete
  const overallStats = getOverallStats()

  if (words.length === 0) {
    return null
  }

  // Final results screen after all 3 levels
  if (allLevelsComplete && overallStats && !showSuccessDialog) {
    const getFeedback = (accuracy: number) => {
      if (accuracy >= 90) return { message: "Outstanding!", color: "text-emerald-600 dark:text-emerald-400", bg: "from-emerald-500/10 to-emerald-500/5" }
      if (accuracy >= 70) return { message: "Great progress!", color: "text-amber-600 dark:text-amber-400", bg: "from-amber-500/10 to-amber-500/5" }
      return { message: "Keep practicing!", color: "text-red-600 dark:text-red-400", bg: "from-red-500/10 to-red-500/5" }
    }

    const feedback = getFeedback(overallStats.accuracy)

    return (
      <Card className="overflow-hidden">
        <div className={`bg-gradient-to-b ${feedback.bg} px-6 pb-6 pt-8`}>
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="mb-2 rounded-full bg-background/80 px-3 py-1 text-sm font-medium shadow-sm">
              All Levels Complete · Chunk {chunkIndex + 1} of {totalChunks}
            </div>

            <div className={`rounded-full bg-background p-3 shadow-sm ${feedback.color}`}>
              <Trophy className="size-8" />
            </div>

            <div className="flex flex-col gap-1">
              <h2 className={`text-xl font-semibold ${feedback.color}`}>{feedback.message}</h2>
              <p className="text-sm text-muted-foreground">
                You&apos;ve completed all three encoding levels
              </p>
            </div>
          </div>
        </div>

        <CardContent className="flex flex-col gap-6 pt-6">
          {/* Big accuracy display */}
          <div className="flex flex-col items-center gap-1">
            <span className={`text-4xl font-bold tabular-nums ${feedback.color}`}>
              {overallStats.accuracy}%
            </span>
            <span className="text-sm text-muted-foreground">Overall Accuracy</span>
          </div>

          {/* Level breakdown */}
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">Level Performance</p>
            {([1, 2, 3] as Level[]).map((level) => {
              const result = levelResults[level]
              if (!result) return null
              return (
                <div key={level} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-sm">
                  <span className="flex items-center gap-2">
                    {getLevelIcon(level)}
                    Level {level}
                  </span>
                  <span className="font-semibold tabular-nums">{result.accuracy}%</span>
                </div>
              )
            })}
          </div>

          {/* Overall stats */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="flex flex-col gap-1 rounded-lg bg-muted/50 p-3">
              <span className="text-lg font-semibold tabular-nums">
                {overallStats.correctCount + overallStats.incorrectCount}
              </span>
              <span className="text-xs text-muted-foreground">Total</span>
            </div>
            <div className="flex flex-col gap-1 rounded-lg bg-emerald-50 p-3 dark:bg-emerald-900/20">
              <span className="text-lg font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                {overallStats.correctCount}
              </span>
              <span className="text-xs text-muted-foreground">Correct</span>
            </div>
            <div className="flex flex-col gap-1 rounded-lg bg-red-50 p-3 dark:bg-red-900/20">
              <span className="text-lg font-semibold tabular-nums text-red-600 dark:text-red-400">
                {overallStats.incorrectCount}
              </span>
              <span className="text-xs text-muted-foreground">Incorrect</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-2">
            {hasNextChunk && onNextChunk && (
              <Button onClick={onNextChunk} size="lg" className="gap-2">
                Next Chunk
                <ArrowRight className="size-4" />
              </Button>
            )}
            {onRetryChunk && (
              <Button onClick={onRetryChunk} variant="outline" size="lg">
                Retry Chunk
              </Button>
            )}
            {onContinueToTest && (
              <Button onClick={onContinueToTest} variant="outline" size="lg">
                Continue to Test
              </Button>
            )}
            {onBackToDetail && (
              <Button onClick={onBackToDetail} variant="ghost" size="lg">
                Back to Detail
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardContent className="flex flex-col gap-4 py-5">
          {/* Level indicator */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                {chunkIndex + 1}
              </span>
              <div className="flex flex-col">
                <span className="flex items-center gap-2 text-sm font-medium">
                  {getLevelIcon(currentLevel)}
                  Level {currentLevel} of 3
                </span>
                <span className="text-xs text-muted-foreground">{getLevelDescription(currentLevel)}</span>
              </div>
            </div>
            <div className="flex gap-1">
              {([1, 2, 3] as Level[]).map((level) => (
                <div
                  key={level}
                  className={`h-1.5 w-8 rounded-full transition-colors ${
                    level < currentLevel
                      ? "bg-emerald-500"
                      : level === currentLevel
                      ? "bg-primary"
                      : "bg-muted"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Start CTA at top — sentinel for IntersectionObserver */}
          {!isLevelComplete && !hasStarted && (
            <Button
              ref={topCtaRef}
              onClick={() => { setHasStarted(true); inputRef.current?.focus() }}
              className="w-full gap-2"
              size="lg"
            >
              <Keyboard className="size-4" />
              Start Typing
            </Button>
          )}

          {/* Words display */}
          <div className="flex flex-wrap gap-2">
            {words.map((wordStatus, i) => (
              <span
                key={i}
                ref={wordStatus.state === "active" ? activeWordRef : null}
                data-keyboard-anchor={wordStatus.state === "active" ? "true" : undefined}
                className="inline-flex"
              >
                <WordBlock status={wordStatus} level={currentLevel} />
              </span>
            ))}
          </div>

          {/* Hidden input captures keyboard input; Start button opens it on mobile */}
          <input
            ref={inputRef}
            value={mobileValue}
            onChange={handleMobileChange}
            maxLength={1}
            inputMode="text"
            autoCapitalize="none"
            autoCorrect="off"
            autoComplete="off"
            spellCheck={false}
            className="sr-only"
            aria-hidden="true"
          />

          {/* Bottom CTA — only appears when top CTA has scrolled off screen */}
          {!isLevelComplete && !hasStarted && !topCtaVisible && (
            <Button
              onClick={() => { setHasStarted(true); inputRef.current?.focus() }}
              className="w-full gap-2"
              size="lg"
            >
              <Keyboard className="size-4" />
              Start Typing
            </Button>
          )}

          {!isLevelComplete && hasStarted && (
            <button
              onClick={() => inputRef.current?.focus()}
              className="text-center text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Tap here if keyboard closed
            </button>
          )}

          {/* Live stats */}
          {!isLevelComplete && (
            <div className="flex items-center justify-between border-t pt-4 text-sm">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                  <Check className="size-4" />
                  {correctCount}
                </span>
                <span className="flex items-center gap-1.5 text-red-600 dark:text-red-400">
                  <X className="size-4" />
                  {incorrectCount}
                </span>
              </div>
              <span className="text-muted-foreground tabular-nums">
                {currentIndex + 1} / {words.length}
              </span>
            </div>
          )}

          {/* Fallback controls when dialog is dismissed via X — prevents user getting stuck */}
          {isLevelComplete && !showSuccessDialog && !allLevelsComplete && (
            <div className="flex flex-col gap-2 border-t pt-4">
              {currentLevel < 3 && (
                <Button onClick={handleContinueToNextLevel} size="sm" className="w-full gap-2">
                  Continue to Level {currentLevel + 1}
                  <ArrowRight className="size-4" />
                </Button>
              )}
              <Button onClick={handleRetryLevel} variant="outline" size="sm" className="w-full">
                Retry Level {currentLevel}
              </Button>
            </div>
          )}

          {/* Level navigation */}
          {!isLevelComplete && (
            <div className="flex items-center justify-center gap-2 border-t pt-4">
              <span className="mr-2 text-xs text-muted-foreground">Jump to:</span>
              {([1, 2, 3] as Level[]).map((level) => (
                <Button
                  key={level}
                  variant={level === currentLevel ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentLevel(level)}
                  className="size-8 p-0"
                  disabled={level === currentLevel}
                >
                  {level}
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Success Dialog between levels */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="mb-4 flex justify-center">
              <div className="rounded-full bg-emerald-100 p-3 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                {currentLevel === 3 ? (
                  <Trophy className="size-8" />
                ) : (
                  <Check className="size-8" />
                )}
              </div>
            </div>
            <DialogTitle className="text-center text-xl">
              {currentLevel === 3 ? "All Levels Complete!" : `Level ${currentLevel} Complete!`}
            </DialogTitle>
            <DialogDescription className="text-center">
              {currentLevel === 3
                ? "You've mastered all three encoding levels for this chunk"
                : `Great work! Ready for Level ${currentLevel + 1}?`}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-4">
            {/* Accuracy */}
            <div className="flex flex-col items-center gap-1">
              <span
                className={`text-3xl font-bold tabular-nums ${
                  accuracy >= 90
                    ? "text-emerald-600 dark:text-emerald-400"
                    : accuracy >= 70
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              >
                {accuracy}%
              </span>
              <span className="text-sm text-muted-foreground">Accuracy</span>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="flex flex-col gap-1 rounded-lg bg-muted/50 p-2">
                <span className="font-semibold tabular-nums">{correctCount + incorrectCount}</span>
                <span className="text-xs text-muted-foreground">Total</span>
              </div>
              <div className="flex flex-col gap-1 rounded-lg bg-emerald-50 p-2 dark:bg-emerald-900/20">
                <span className="font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                  {correctCount}
                </span>
                <span className="text-xs text-muted-foreground">Correct</span>
              </div>
              <div className="flex flex-col gap-1 rounded-lg bg-red-50 p-2 dark:bg-red-900/20">
                <span className="font-semibold tabular-nums text-red-600 dark:text-red-400">
                  {incorrectCount}
                </span>
                <span className="text-xs text-muted-foreground">Incorrect</span>
              </div>
            </div>
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-col">
            {currentLevel < 3 ? (
              <>
                <Button onClick={handleContinueToNextLevel} size="lg" className="w-full gap-2">
                  Continue to Level {currentLevel + 1}
                  <ArrowRight className="size-4" />
                </Button>
                <Button onClick={handleRetryLevel} variant="outline" size="lg" className="w-full">
                  Retry Level {currentLevel}
                </Button>
              </>
            ) : (
              <Button onClick={() => setShowSuccessDialog(false)} size="lg" className="w-full">
                View Results
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function WordBlock({ status, level }: { status: WordStatus; level: Level }) {
  const { word, state, showError, wasIncorrect, isHiddenInLevel2 } = status

  // Error — always shown over any other state
  if (state === "error" && showError) {
    return (
      <span className="rounded bg-red-100 px-2 py-1 font-mono text-red-600 ring-2 ring-red-500 dark:bg-red-900/30 dark:text-red-400">
        <span className="font-bold uppercase">{word.firstLetter}</span>
        {word.word.slice(1)}
      </span>
    )
  }

  // Revealed — green if correct, red if incorrect
  if (state === "revealed") {
    return wasIncorrect ? (
      <span className="rounded bg-red-100 px-2 py-1 font-mono text-red-600 dark:bg-red-900/30 dark:text-red-400">{word.word}</span>
    ) : (
      <span className="rounded bg-green-100 px-2 py-1 font-mono text-green-700 dark:bg-green-900/30 dark:text-green-400">{word.word}</span>
    )
  }

  // Level 1: all words show text. Level 2 hint words (non-hidden): show text with amber tint.
  const isTextVisible = level === 1 || (level === 2 && !isHiddenInLevel2)

  if (isTextVisible) {
    if (state === "active") {
      return (
        <span className="rounded bg-primary/20 px-2 py-1 font-mono text-primary ring-2 ring-primary">
          {word.word}
        </span>
      )
    }
    return (
      <span className={`rounded px-2 py-1 font-mono ${
        level === 2
          ? "bg-amber-50 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300"
          : "bg-muted/50 text-foreground"
      }`}>
        {word.word}
      </span>
    )
  }

  // Level 2 hidden + Level 3: show blank underscores
  if (state === "active") {
    return (
      <span className="animate-pulse rounded bg-primary/20 px-2 py-1 font-mono text-primary ring-2 ring-primary">
        {"_".repeat(Math.min(word.word.length, 8))}
      </span>
    )
  }

  return (
    <span className="rounded bg-muted px-2 py-1 font-mono text-muted-foreground">
      {"_".repeat(Math.min(word.word.length, 8))}
    </span>
  )
}
