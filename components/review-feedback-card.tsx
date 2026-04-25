"use client"

import { CheckCircle2, AlertTriangle, XCircle, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { gradeLabel, formatNextReview, type SRSGrade } from "@/lib/srs"

interface ReviewFeedbackCardProps {
  grade: SRSGrade
  score: number
  nextReviewAt: Date
  onContinue: () => void
  onAdjustSchedule?: () => void
}

const gradeConfig = {
  perfect: {
    icon: CheckCircle2,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-900/20",
    ring: "ring-emerald-200 dark:ring-emerald-800",
  },
  medium: {
    icon: AlertTriangle,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-900/20",
    ring: "ring-amber-200 dark:ring-amber-800",
  },
  fail: {
    icon: XCircle,
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-900/20",
    ring: "ring-red-200 dark:ring-red-800",
  },
}

export function ReviewFeedbackCard({
  grade,
  score,
  nextReviewAt,
  onContinue,
  onAdjustSchedule,
}: ReviewFeedbackCardProps) {
  const cfg = gradeConfig[grade]
  const Icon = cfg.icon

  return (
    <Card className={cn("ring-2", cfg.ring)}>
      <CardContent className="flex flex-col items-center gap-5 py-8 px-6">
        <div className={cn("flex size-16 items-center justify-center rounded-full", cfg.bg)}>
          <Icon className={cn("size-8", cfg.color)} />
        </div>

        <div className="flex flex-col items-center gap-1 text-center">
          <p className={cn("text-xl font-bold", cfg.color)}>{gradeLabel(grade)}</p>
          <p className="text-4xl font-bold tabular-nums">{score}%</p>
        </div>

        <div className="flex items-center gap-2 rounded-xl bg-muted/50 px-4 py-2.5 text-sm">
          <Clock className="size-4 text-muted-foreground shrink-0" />
          <span className="text-muted-foreground">Next review:</span>
          <span className="font-semibold">{formatNextReview(nextReviewAt)}</span>
        </div>

        <div className="flex w-full flex-col gap-2">
          <Button onClick={onContinue} className="w-full">
            Continue
          </Button>
          {onAdjustSchedule && (
            <Button variant="ghost" size="sm" onClick={onAdjustSchedule} className="w-full text-muted-foreground">
              Adjust Schedule
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
