"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { compareTexts, type ComparisonResult, type WordComparisonStatus } from "@/lib/text-utils"
import { CheckCircle2, XCircle, AlertTriangle, Plus, RotateCcw, ArrowLeft, Trophy, TrendingUp, BookOpen, FileText } from "lucide-react"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty"
import { useMemorization } from "@/lib/memorization-context"
import { toast } from "sonner"

interface TypingTestProps {
  setId: string
  content: string
  onBack: () => void
}

function getWordClassName(status: WordComparisonStatus): string {
  switch (status) {
    case "correct":
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
    case "incorrect":
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
    case "missing":
      return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
    case "extra":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
  }
}

function getFeedback(accuracy: number): { label: string; description: string; icon: React.ReactNode; colorClass: string } {
  if (accuracy >= 90) {
    return {
      label: "Excellent recall",
      description: "Outstanding work! You have mastered this content.",
      icon: <Trophy className="size-5" />,
      colorClass: "text-emerald-600 dark:text-emerald-400",
    }
  }
  if (accuracy >= 75) {
    return {
      label: "Strong progress",
      description: "Good job! A few more practice sessions will help solidify your memory.",
      icon: <TrendingUp className="size-5" />,
      colorClass: "text-amber-600 dark:text-amber-400",
    }
  }
  return {
    label: "Needs more review",
    description: "Keep practicing! Focus on the sections you missed.",
    icon: <BookOpen className="size-5" />,
    colorClass: "text-red-600 dark:text-red-400",
  }
}

export function TypingTest({ setId, content, onBack }: TypingTestProps) {
  const { updateTestScore } = useMemorization()
  const [typedText, setTypedText] = useState("")
  const [result, setResult] = useState<ComparisonResult | null>(null)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = () => {
    const comparison = compareTexts(typedText, content)
    setResult(comparison)
    setIsSubmitted(true)
    
    // Save test score
    updateTestScore(setId, "fullText", comparison.accuracy)
    toast.success("Progress saved")
  }

  const handleRetry = () => {
    setTypedText("")
    setResult(null)
    setIsSubmitted(false)
  }

  const wordCount = content.split(/\s+/).filter((w) => w.length > 0).length
  const typedWordCount = typedText.split(/\s+/).filter((w) => w.length > 0).length

  // Empty content state
  if (wordCount === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-4">
        <Empty className="max-w-sm border-0">
          <EmptyHeader>
            <EmptyMedia variant="icon" className="size-12 rounded-full bg-muted text-muted-foreground [&_svg]:size-5">
              <FileText />
            </EmptyMedia>
            <EmptyTitle>No content to test</EmptyTitle>
            <EmptyDescription>
              This memorization set doesn&apos;t have any content to test. Try a different set.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button onClick={onBack} className="w-full">
              Return to Detail
            </Button>
          </EmptyContent>
        </Empty>
      </div>
    )
  }

  // Input mode
  if (!isSubmitted) {
    return (
      <div className="flex flex-1 flex-col gap-4">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Type from Memory</CardTitle>
            <CardDescription>
              Recall and type the entire passage ({wordCount} words)
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Textarea
              placeholder="Start typing the passage from memory..."
              value={typedText}
              onChange={(e) => setTypedText(e.target.value)}
              className="min-h-48 resize-none"
              autoFocus
            />
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {typedWordCount} / {wordCount} words
              </span>
              <Button 
                onClick={handleSubmit}
                disabled={typedText.trim().length === 0}
              >
                Check Results
              </Button>
            </div>
          </CardContent>
        </Card>

        <Button variant="ghost" onClick={onBack}>
          Back to Detail
        </Button>
      </div>
    )
  }

  const feedback = getFeedback(result?.accuracy ?? 0)

  // Results mode
  return (
    <div className="flex flex-1 flex-col gap-4 pb-4">
      {/* Accuracy & Feedback */}
      <Card>
        <CardContent className="py-6">
          <div className="flex flex-col items-center gap-4 text-center">
            {/* Accuracy Score */}
            <div className="flex flex-col items-center gap-1">
              <span className="text-4xl font-bold tabular-nums">
                {result?.accuracy ?? 0}%
              </span>
              <span className="text-sm text-muted-foreground">Accuracy</span>
            </div>

            {/* Feedback */}
            <div className={`flex items-center gap-2 ${feedback.colorClass}`}>
              {feedback.icon}
              <span className="font-semibold">{feedback.label}</span>
            </div>
            <p className="max-w-xs text-sm text-muted-foreground">
              {feedback.description}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Stats Breakdown */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-3 rounded-lg bg-emerald-50 p-3 dark:bg-emerald-900/20">
              <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
              <div className="flex flex-col">
                <span className="font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
                  {result?.correctCount ?? 0}
                </span>
                <span className="text-xs text-muted-foreground">Correct</span>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-red-50 p-3 dark:bg-red-900/20">
              <XCircle className="size-4 text-red-600 dark:text-red-400" />
              <div className="flex flex-col">
                <span className="font-semibold tabular-nums text-red-700 dark:text-red-400">
                  {result?.incorrectCount ?? 0}
                </span>
                <span className="text-xs text-muted-foreground">Incorrect</span>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-amber-50 p-3 dark:bg-amber-900/20">
              <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400" />
              <div className="flex flex-col">
                <span className="font-semibold tabular-nums text-amber-700 dark:text-amber-400">
                  {result?.missingCount ?? 0}
                </span>
                <span className="text-xs text-muted-foreground">Missing</span>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
              <Plus className="size-4 text-blue-600 dark:text-blue-400" />
              <div className="flex flex-col">
                <span className="font-semibold tabular-nums text-blue-700 dark:text-blue-400">
                  {result?.extraCount ?? 0}
                </span>
                <span className="text-xs text-muted-foreground">Extra</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Visual Comparison */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Visual Comparison</CardTitle>
          <CardDescription>
            See how your answer compares to the original
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-1.5">
            {result?.words.map((word, index) => (
              <span
                key={index}
                className={`inline-flex items-center rounded px-1.5 py-0.5 text-sm font-medium ${getWordClassName(word.status)}`}
                title={word.expected ? `Expected: ${word.expected}` : undefined}
              >
                {word.displayWord}
              </span>
            ))}
          </div>
          
          {/* Legend */}
          <div className="mt-4 flex flex-wrap gap-4 border-t pt-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <span className="size-3 rounded bg-emerald-100 dark:bg-emerald-900/30" />
              <span>Correct</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="size-3 rounded bg-red-100 dark:bg-red-900/30" />
              <span>Incorrect</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="size-3 rounded bg-amber-100 dark:bg-amber-900/30" />
              <span>Missing</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="size-3 rounded bg-blue-100 dark:bg-blue-900/30" />
              <span>Extra</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mistakes Detail */}
      {result && result.mistakes.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              Mistakes ({result.mistakes.length})
            </CardTitle>
            <CardDescription>
              Review what you got wrong
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              {result.mistakes.slice(0, 10).map((mistake, index) => (
                <div 
                  key={index}
                  className="flex items-start gap-3 rounded-lg bg-muted/50 p-3"
                >
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                    {mistake.wordIndex + 1}
                  </span>
                  <div className="flex flex-1 flex-col gap-1 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">You typed:</span>
                      <span className="font-medium text-red-600 dark:text-red-400">
                        {mistake.typed}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Expected:</span>
                      <span className="font-medium text-emerald-600 dark:text-emerald-400">
                        {mistake.expected}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {result.mistakes.length > 10 && (
                <p className="text-center text-sm text-muted-foreground">
                  +{result.mistakes.length - 10} more mistakes
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-2 pt-2">
        <Button size="lg" onClick={handleRetry} className="gap-2">
          <RotateCcw className="size-4" />
          Retry Test
        </Button>
        <Button size="lg" variant="outline" onClick={onBack} className="gap-2">
          <ArrowLeft className="size-4" />
          Return to Detail
        </Button>
      </div>
    </div>
  )
}
