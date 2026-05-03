"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { parseWords, type ParsedWord } from "@/lib/text-utils"
import { ResultsScreen } from "@/components/results-screen"
import { Check, X, Keyboard } from "lucide-react"

interface ChunkEncoderProps {
  chunk: string
  chunkIndex: number
  totalChunks: number
  onRetryChunk?: () => void
  onNextChunk?: () => void
  onContinueToTest?: () => void
  onBackToDetail?: () => void
  hasNextChunk?: boolean
}

type WordState = "hidden" | "active" | "revealed" | "error"

interface WordStatus {
  word: ParsedWord
  state: WordState
  showError: boolean
  wasIncorrect: boolean
}

export function ChunkEncoder({ 
  chunk, 
  chunkIndex, 
  totalChunks,
  onRetryChunk,
  onNextChunk,
  onContinueToTest,
  onBackToDetail,
  hasNextChunk = false,
}: ChunkEncoderProps) {
  const [words, setWords] = useState<WordStatus[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [incorrectCount, setIncorrectCount] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  const [mobileValue, setMobileValue] = useState("")
  const [hasStarted, setHasStarted] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const wordsRef = useRef<WordStatus[]>([])
  const currentIndexRef = useRef(0)
  const isCompleteRef = useRef(false)
  const lockedRef = useRef(false)
  const hasStartedRef = useRef(false)
  const isMobileRef = useRef(false)
  const lastInputRef = useRef<{ key: string; index: number; ts: number } | null>(null)

  const initializeWords = useCallback(() => {
    const parsed = parseWords(chunk)
    const initialWords = parsed.map((word, i) => ({
        word,
        state: i === 0 ? "active" : "hidden",
        showError: false,
        wasIncorrect: false,
      }))
    setWords(initialWords)
    wordsRef.current = initialWords
    currentIndexRef.current = 0
    isCompleteRef.current = false
    lockedRef.current = false
    hasStartedRef.current = false
    lastInputRef.current = null
    setCurrentIndex(0)
    setCorrectCount(0)
    setIncorrectCount(0)
    setIsComplete(false)
    setHasStarted(false)
  }, [chunk])

  useEffect(() => {
    initializeWords()
  }, [initializeWords])

  useEffect(() => {
    wordsRef.current = words
  }, [words])

  useEffect(() => {
    currentIndexRef.current = currentIndex
  }, [currentIndex])

  useEffect(() => {
    isCompleteRef.current = isComplete
  }, [isComplete])

  useEffect(() => {
    hasStartedRef.current = hasStarted
  }, [hasStarted])

  useEffect(() => {
    isMobileRef.current = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
  }, [])

  const processLetterInput = useCallback((rawKey: string) => {
      if (isCompleteRef.current || wordsRef.current.length === 0) return
      if (lockedRef.current) return
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
        setCorrectCount((c) => c + 1)
        const nextIndex = idx + 1
        if (nextIndex >= wordsRef.current.length) {
          setIsComplete(true)
          isCompleteRef.current = true
        } else {
          currentIndexRef.current = nextIndex
          setCurrentIndex(nextIndex)
        }
        setWords((prev) =>
          prev.map((w, i) => {
            if (i === idx) {
              return { ...w, state: "revealed" }
            }
            if (i === nextIndex) {
              return { ...w, state: "active" }
            }
            return w
          })
        )
      } else {
        lockedRef.current = true
        setIncorrectCount((c) => c + 1)
        setWords((prev) =>
          prev.map((w, i) =>
            i === idx ? { ...w, state: "error", showError: true, wasIncorrect: true } : w
          )
        )

        setTimeout(() => {
          const nextIndex = idx + 1
          setWords((prev) =>
            prev.map((w, i) => {
              if (i === idx) {
                return { ...w, state: "revealed", showError: false, wasIncorrect: true }
              }
              if (i === nextIndex) {
                return { ...w, state: "active" }
              }
              return w
            })
          )

          if (nextIndex >= wordsRef.current.length) {
            setIsComplete(true)
            isCompleteRef.current = true
          } else {
            currentIndexRef.current = nextIndex
            setCurrentIndex(nextIndex)
          }
          lockedRef.current = false
        }, 800)
      }
    }, [])

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
    if (!isComplete && !isMobile) inputRef.current?.focus()
  }, [isComplete])

  const totalAttempts = correctCount + incorrectCount
  const accuracy = totalAttempts > 0 ? Math.round((correctCount / totalAttempts) * 100) : 0

  if (words.length === 0) {
    return null
  }

  const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    if (val.length > 0) {
      const firstLetter = val.toLowerCase().match(/[a-z]/)?.[0]
      if (firstLetter) processLetterInput(firstLetter)
    }
    e.target.value = ""
    setMobileValue("")
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 py-5">
        <div className="flex items-center gap-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
            {chunkIndex + 1}
          </span>
          <span className="text-sm text-muted-foreground">
            Type the first letter of each word
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {words.map((wordStatus, i) => (
            <WordBlock key={i} status={wordStatus} />
          ))}
        </div>

        {/* Hidden input captures keyboard input; Start button opens it on mobile */}
        {!isComplete && (
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
        )}

        {!isComplete && !hasStarted && (
          <Button
            onClick={() => { setHasStarted(true); inputRef.current?.focus() }}
            className="w-full gap-2"
            size="lg"
          >
            <Keyboard className="size-4" />
            Start Typing
          </Button>
        )}

        {!isComplete && hasStarted && (
          <button
            onClick={() => inputRef.current?.focus()}
            className="text-center text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Tap here if keyboard closed
          </button>
        )}

        {!isComplete && (
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

        {isComplete && (
          <ResultsScreen
            accuracy={accuracy}
            correctCount={correctCount}
            incorrectCount={incorrectCount}
            chunkIndex={chunkIndex}
            totalChunks={totalChunks}
            onRetry={onRetryChunk || initializeWords}
            onNextChunk={onNextChunk}
            onContinueToTest={onContinueToTest}
            onBackToDetail={onBackToDetail}
            hasNextChunk={hasNextChunk}
          />
        )}
      </CardContent>
    </Card>
  )
}

function WordBlock({ status }: { status: WordStatus }) {
  const { word, state, showError, wasIncorrect } = status

  if (state === "hidden") {
    return (
      <span className="rounded bg-muted px-2 py-1 font-mono text-muted-foreground">
        {"_".repeat(Math.min(word.word.length, 8))}
      </span>
    )
  }

  if (state === "active") {
    return (
      <span className="animate-pulse rounded bg-primary/20 px-2 py-1 font-mono text-primary ring-2 ring-primary">
        {"_".repeat(Math.min(word.word.length, 8))}
      </span>
    )
  }

  if (state === "error" && showError) {
    return (
      <span className="rounded bg-red-100 px-2 py-1 font-mono text-red-600 ring-2 ring-red-500 dark:bg-red-900/30 dark:text-red-400">
        <span className="font-bold uppercase">{word.firstLetter}</span>
        {word.word.slice(1)}
      </span>
    )
  }

  // Revealed state - show red if it was incorrect, green if correct
  if (wasIncorrect) {
    return (
      <span className="rounded bg-red-100 px-2 py-1 font-mono text-red-600 dark:bg-red-900/30 dark:text-red-400">
        {word.word}
      </span>
    )
  }

  return (
    <span className="rounded bg-green-100 px-2 py-1 font-mono text-green-700 dark:bg-green-900/30 dark:text-green-400">
      {word.word}
    </span>
  )
}
