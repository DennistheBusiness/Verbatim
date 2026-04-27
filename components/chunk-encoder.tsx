"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { parseWords, type ParsedWord } from "@/lib/text-utils"
import { ResultsScreen } from "@/components/results-screen"
import { Check, X } from "lucide-react"

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
  const inputRef = useRef<HTMLInputElement>(null)

  const initializeWords = useCallback(() => {
    const parsed = parseWords(chunk)
    setWords(
      parsed.map((word, i) => ({
        word,
        state: i === 0 ? "active" : "hidden",
        showError: false,
        wasIncorrect: false,
      }))
    )
    setCurrentIndex(0)
    setCorrectCount(0)
    setIncorrectCount(0)
    setIsComplete(false)
  }, [chunk])

  useEffect(() => {
    initializeWords()
  }, [initializeWords])

  const handleKeyPress = useCallback(
    (e: KeyboardEvent) => {
      if (isComplete || words.length === 0) return
      
      const key = e.key.toLowerCase()
      
      // Only handle single letter keys
      if (!/^[a-z]$/.test(key)) return

      const currentWord = words[currentIndex]
      if (!currentWord) return

      if (key === currentWord.word.firstLetter) {
        // Correct letter
        setCorrectCount((c) => c + 1)
        setWords((prev) =>
          prev.map((w, i) => {
            if (i === currentIndex) {
              return { ...w, state: "revealed" }
            }
            if (i === currentIndex + 1) {
              return { ...w, state: "active" }
            }
            return w
          })
        )

        if (currentIndex + 1 >= words.length) {
          setIsComplete(true)
        } else {
          setCurrentIndex((i) => i + 1)
        }
      } else {
        // Incorrect letter
        setIncorrectCount((c) => c + 1)
        setWords((prev) =>
          prev.map((w, i) =>
            i === currentIndex ? { ...w, state: "error", showError: true, wasIncorrect: true } : w
          )
        )

        // Show error briefly, then move to next word
        setTimeout(() => {
          setWords((prev) =>
            prev.map((w, i) => {
              if (i === currentIndex) {
                return { ...w, state: "revealed", showError: false, wasIncorrect: true }
              }
              if (i === currentIndex + 1) {
                return { ...w, state: "active" }
              }
              return w
            })
          )

          if (currentIndex + 1 >= words.length) {
            setIsComplete(true)
          } else {
            setCurrentIndex((i) => i + 1)
          }
        }, 800)
      }
    },
    [currentIndex, isComplete, words]
  )

  useEffect(() => {
    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [handleKeyPress])

  // Auto-focus the hidden input so the mobile keyboard is available immediately
  useEffect(() => {
    if (!isComplete) inputRef.current?.focus()
  }, [isComplete])

  const totalAttempts = correctCount + incorrectCount
  const accuracy = totalAttempts > 0 ? Math.round((correctCount / totalAttempts) * 100) : 0

  if (words.length === 0) {
    return null
  }

  // Route mobile keyboard input into the existing key handler
  const handleMobileInput = (e: React.FormEvent<HTMLInputElement>) => {
    const data = (e.nativeEvent as InputEvent).data
    if (data) {
      const key = data.slice(-1).toLowerCase()
      if (/^[a-z]$/.test(key)) handleKeyPress({ key } as KeyboardEvent)
    }
    ;(e.target as HTMLInputElement).value = ""
  }

  return (
    <Card onClick={() => inputRef.current?.focus()}>
      {/* Hidden input — gives mobile keyboard a target to type into */}
      <input
        ref={inputRef}
        onInput={handleMobileInput}
        inputMode="text"
        autoCapitalize="none"
        autoCorrect="off"
        autoComplete="off"
        spellCheck={false}
        className="absolute opacity-0 w-0 h-0 pointer-events-none"
        readOnly={false}
        defaultValue=""
        aria-hidden="true"
      />
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
