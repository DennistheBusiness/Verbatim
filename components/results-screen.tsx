"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RotateCcw, ArrowRight, Trophy, BookOpen, ArrowLeft } from "lucide-react"

interface ResultsScreenProps {
  accuracy: number
  correctCount: number
  incorrectCount: number
  chunkIndex?: number
  totalChunks?: number
  onRetry: () => void
  onNextChunk?: () => void
  onContinueToTest?: () => void
  onBackToDetail?: () => void
  hasNextChunk?: boolean
  // Legacy props for typing test compatibility
  onContinue?: () => void
  showContinue?: boolean
}

function getFeedback(accuracy: number): { 
  message: string
  description: string
  icon: typeof Trophy
  color: string
} {
  if (accuracy >= 90) {
    return {
      message: "Strong recall",
      description: "Excellent work! You have a solid grasp of this material.",
      icon: Trophy,
      color: "text-emerald-600 dark:text-emerald-400",
    }
  }
  if (accuracy >= 70) {
    return {
      message: "Good progress",
      description: "You're getting there. A few more practice rounds will help.",
      icon: BookOpen,
      color: "text-amber-600 dark:text-amber-400",
    }
  }
  return {
    message: "Needs review",
    description: "Take some time to review the material before trying again.",
    icon: BookOpen,
    color: "text-red-600 dark:text-red-400",
  }
}

function getAccuracyColor(accuracy: number): string {
  if (accuracy >= 90) return "text-emerald-600 dark:text-emerald-400"
  if (accuracy >= 70) return "text-amber-600 dark:text-amber-400"
  return "text-red-600 dark:text-red-400"
}

function getAccuracyBgColor(accuracy: number): string {
  if (accuracy >= 90) return "from-emerald-500/10 to-emerald-500/5"
  if (accuracy >= 70) return "from-amber-500/10 to-amber-500/5"
  return "from-red-500/10 to-red-500/5"
}

export function ResultsScreen({
  accuracy,
  correctCount,
  incorrectCount,
  chunkIndex,
  totalChunks,
  onRetry,
  onNextChunk,
  onContinueToTest,
  onBackToDetail,
  hasNextChunk = false,
  // Legacy props
  onContinue,
  showContinue,
}: ResultsScreenProps) {
  const feedback = getFeedback(accuracy)
  const FeedbackIcon = feedback.icon
  const total = correctCount + incorrectCount
  const showChunkProgress = typeof chunkIndex === "number" && typeof totalChunks === "number"

  // Determine which button mode to use
  const useLegacyButtons = typeof onContinue === "function" && showContinue !== undefined

  return (
    <Card className="overflow-hidden">
      <div className={`bg-gradient-to-b ${getAccuracyBgColor(accuracy)} px-6 pb-6 pt-8`}>
        <div className="flex flex-col items-center gap-3 text-center">
          {/* Chunk progress indicator */}
          {showChunkProgress && (
            <div className="mb-2 rounded-full bg-background/80 px-3 py-1 text-sm font-medium shadow-sm">
              Chunk {chunkIndex + 1} of {totalChunks}
            </div>
          )}

          <div className={`rounded-full bg-background p-3 shadow-sm ${feedback.color}`}>
            <FeedbackIcon className="size-8" />
          </div>
          
          <div className="flex flex-col gap-1">
            <h2 className={`text-xl font-semibold ${feedback.color}`}>
              {feedback.message}
            </h2>
            <p className="text-sm text-muted-foreground">
              {feedback.description}
            </p>
          </div>
        </div>
      </div>

      <CardContent className="flex flex-col gap-6 pt-6">
        {/* Big accuracy display */}
        <div className="flex flex-col items-center gap-1">
          <span className={`text-4xl font-bold tabular-nums ${getAccuracyColor(accuracy)}`}>
            {accuracy}%
          </span>
          <span className="text-sm text-muted-foreground">Accuracy</span>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="flex flex-col gap-1 rounded-lg bg-muted/50 p-3">
            <span className="text-lg font-semibold tabular-nums">{total}</span>
            <span className="text-xs text-muted-foreground">Total</span>
          </div>
          <div className="flex flex-col gap-1 rounded-lg bg-emerald-50 p-3 dark:bg-emerald-900/20">
            <span className="text-lg font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
              {correctCount}
            </span>
            <span className="text-xs text-muted-foreground">Correct</span>
          </div>
          <div className="flex flex-col gap-1 rounded-lg bg-red-50 p-3 dark:bg-red-900/20">
            <span className="text-lg font-semibold tabular-nums text-red-600 dark:text-red-400">
              {incorrectCount}
            </span>
            <span className="text-xs text-muted-foreground">Incorrect</span>
          </div>
        </div>

        {/* Action buttons */}
        {useLegacyButtons ? (
          // Legacy button layout for typing test
          <div className="flex flex-col gap-2">
            <Button onClick={onRetry} variant="outline" className="gap-2">
              <RotateCcw className="size-4" />
              Retry
            </Button>
            {showContinue && onContinue && (
              <Button onClick={onContinue} className="gap-2">
                Continue
                <ArrowRight className="size-4" />
              </Button>
            )}
          </div>
        ) : (
          // Chunk-level button layout
          <div className="flex flex-col gap-2">
            <Button onClick={onRetry} variant="outline" className="gap-2">
              <RotateCcw className="size-4" />
              Retry Chunk
            </Button>
            
            {hasNextChunk && onNextChunk && (
              <Button onClick={onNextChunk} className="gap-2">
                Next Chunk
                <ArrowRight className="size-4" />
              </Button>
            )}

            {!hasNextChunk && onContinueToTest && (
              <Button onClick={onContinueToTest} className="gap-2">
                Continue to Test
                <ArrowRight className="size-4" />
              </Button>
            )}
            
            {onBackToDetail && (
              <Button 
                onClick={onBackToDetail} 
                variant={hasNextChunk || onContinueToTest ? "ghost" : "default"}
                className="gap-2"
              >
                <ArrowLeft className="size-4" />
                Back to Detail
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
