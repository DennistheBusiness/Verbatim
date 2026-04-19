"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { parseWords, type ParsedWord } from "@/lib/text-utils"
import { Check, X, RotateCcw, Trophy, TrendingUp, BookOpen, FileText } from "lucide-react"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty"
import { useMemorization } from "@/lib/memorization-context"
import { toast } from "sonner"

interface FullFirstLetterTestProps {
  setId: string
  content: string
  onRetry?: () => void
  onBack?: () => void
}

type WordState = "hidden" | "active" | "revealed" | "error"

interface WordStatus {
  word: ParsedWord
  state: WordState
  showError: boolean
  wasIncorrect: boolean
}

function getFeedback(accuracy: number): { label: string; color: string; icon: React.ReactNode } {
  if (accuracy >= 90) {
    return {
      label: "Excellent recall",
      color: "text-green-600 dark:text-green-400",
      icon: <Trophy className="size-5" />,
    }
  }
  if (accuracy >= 75) {
    return {
      label: "Strong progress",
      color: "text-blue-600 dark:text-blue-400",
      icon: <TrendingUp className="size-5" />,
    }
  }
  return {
    label: "Needs more review",
    color: "text-amber-600 dark:text-amber-400",
    icon: <BookOpen className="size-5" />,
  }
}

export function FullFirstLetterTest({ setId, content, onRetry, onBack }: FullFirstLetterTestProps) {
  const { updateTestScore } = useMemorization()
  const [words, setWords] = useState<WordStatus[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [incorrectCount, setIncorrectCount] = useState(0)
  const [isComplete, setIsComplete] = useState(false)

  const initializeWords = useCallback(() => {
    const parsed = parseWords(content)
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
  }, [content])

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
        }, 600)
      }
    },
    [currentIndex, isComplete, words]
  )

  useEffect(() => {
    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [handleKeyPress])

  // Save test score when completed
  useEffect(() => {
    if (isComplete && (correctCount > 0 || incorrectCount > 0)) {
      const totalAttempts = correctCount + incorrectCount
      const accuracy = totalAttempts > 0 ? Math.round((correctCount / totalAttempts) * 100) : 0
      updateTestScore(setId, "firstLetter", accuracy)
      toast.success("Progress saved")
    }
  }, [isComplete, correctCount, incorrectCount, setId, updateTestScore])

  const totalAttempts = correctCount + incorrectCount
  const accuracy = totalAttempts > 0 ? Math.round((correctCount / totalAttempts) * 100) : 0
  const feedback = getFeedback(accuracy)

  if (words.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-4">
        <Empty className="max-w-sm border-0">
          <EmptyHeader>
            <EmptyMedia variant="icon" className="size-12 rounded-full bg-muted text-muted-foreground [&_svg]:size-5">
              <FileText />
            </EmptyMedia>
            <EmptyTitle>No words to test</EmptyTitle>
            <EmptyDescription>
              This content doesn&apos;t have any words to practice. Try a different memorization set.
            </EmptyDescription>
          </EmptyHeader>
          {onBack && (
            <EmptyContent>
              <Button onClick={onBack} className="w-full">
                Return to Detail
              </Button>
            </EmptyContent>
          )}
        </Empty>
      </div>
    )
  }

  const handleRetry = () => {
    initializeWords()
    onRetry?.()
  }

  // Results screen
  if (isComplete) {
    return (
      <div className="flex flex-1 flex-col gap-4">
        {/* Accuracy Card */}
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-6">
            <div className={`flex items-center gap-2 ${feedback.color}`}>
              {feedback.icon}
              <span className="font-medium">{feedback.label}</span>
            </div>
            
            <div className="flex flex-col items-center">
              <span className="text-4xl font-bold tabular-nums">{accuracy}%</span>
              <span className="text-sm text-muted-foreground">Accuracy</span>
            </div>

            <div className="grid w-full max-w-xs grid-cols-2 gap-2 text-center">
              <div className="flex flex-col rounded-lg bg-emerald-50 p-3 dark:bg-emerald-900/20">
                <span className="text-lg font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
                  {correctCount}
                </span>
                <span className="text-xs text-muted-foreground">Correct</span>
              </div>
              <div className="flex flex-col rounded-lg bg-red-50 p-3 dark:bg-red-900/20">
                <span className="text-lg font-semibold tabular-nums text-red-700 dark:text-red-400">
                  {incorrectCount}
                </span>
                <span className="text-xs text-muted-foreground">Incorrect</span>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              {words.length} words completed
            </p>
          </CardContent>
        </Card>

        {/* Word Review */}
        <Card>
          <CardContent className="py-4">
            <p className="mb-3 text-sm font-medium text-muted-foreground">Your Results</p>
            <div className="flex flex-wrap gap-1.5">
              {words.map((wordStatus, i) => (
                <span
                  key={i}
                  className={`rounded px-1.5 py-0.5 text-sm font-mono ${
                    wordStatus.wasIncorrect
                      ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  }`}
                >
                  {wordStatus.word.word}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <Button onClick={handleRetry} className="gap-2">
            <RotateCcw className="size-4" />
            Retry Test
          </Button>
          {onBack && (
            <Button variant="outline" onClick={onBack}>
              Return to Detail
            </Button>
          )}
        </div>
      </div>
    )
  }

  // Test in progress
  return (
    <div className="flex flex-1 flex-col gap-4">
      {/* Progress Header */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          Type the first letter of each word
        </span>
        <div className="flex items-center gap-3 text-sm">
          <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
            <Check className="size-4" />
            {correctCount}
          </span>
          <span className="flex items-center gap-1.5 text-red-600 dark:text-red-400">
            <X className="size-4" />
            {incorrectCount}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div 
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${((currentIndex) / words.length) * 100}%` }}
        />
      </div>

      <p className="text-center text-sm text-muted-foreground">
        {currentIndex + 1} of {words.length} words
      </p>

      {/* Words Display */}
      <Card className="flex-1">
        <CardContent className="py-4">
          <div className="flex flex-wrap gap-2">
            {words.map((wordStatus, i) => (
              <WordBlock key={i} status={wordStatus} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function WordBlock({ status }: { status: WordStatus }) {
  const { word, state, showError, wasIncorrect } = status

  if (state === "hidden") {
    return (
      <span className="rounded bg-muted px-2 py-1 font-mono text-sm text-muted-foreground">
        {"_".repeat(Math.min(word.word.length, 8))}
      </span>
    )
  }

  if (state === "active") {
    return (
      <span className="animate-pulse rounded bg-primary/20 px-2 py-1 font-mono text-sm text-primary ring-2 ring-primary">
        {"_".repeat(Math.min(word.word.length, 8))}
      </span>
    )
  }

  if (state === "error" && showError) {
    return (
      <span className="rounded bg-red-100 px-2 py-1 font-mono text-sm text-red-600 ring-2 ring-red-500 dark:bg-red-900/30 dark:text-red-400">
        <span className="font-bold uppercase">{word.firstLetter}</span>
        {word.word.slice(1)}
      </span>
    )
  }

  // Revealed state - show red if it was incorrect, green if correct
  if (wasIncorrect) {
    return (
      <span className="rounded bg-red-100 px-2 py-1 font-mono text-sm text-red-600 dark:bg-red-900/30 dark:text-red-400">
        {word.word}
      </span>
    )
  }

  return (
    <span className="rounded bg-green-100 px-2 py-1 font-mono text-sm text-green-700 dark:bg-green-900/30 dark:text-green-400">
      {word.word}
    </span>
  )
}
