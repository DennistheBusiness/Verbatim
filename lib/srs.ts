// Simplified SM-2 spaced repetition algorithm

export type SRSGrade = "perfect" | "medium" | "fail"

export type RepetitionPeriod = "day" | "week" | "month"

export interface RepetitionConfig {
  frequency: number
  period: RepetitionPeriod
}

export interface SRSState {
  easeFactor: number   // clamped [1.3, 2.5]
  intervalDays: number
  repetitions: number
}

export function gradeFromScore(score: number): SRSGrade {
  if (score >= 86) return "perfect"
  if (score >= 60) return "medium"
  return "fail"
}

export function computeNextSRS(
  current: SRSState,
  grade: SRSGrade
): SRSState & { nextReviewAt: Date } {
  let { easeFactor, intervalDays, repetitions } = current

  if (grade === "fail") {
    intervalDays = 1
    repetitions = 0
    easeFactor = Math.max(1.3, easeFactor - 0.2)
  } else if (grade === "medium") {
    intervalDays = Math.max(1, intervalDays * 1.5)
    repetitions += 1
  } else {
    // perfect
    intervalDays = repetitions === 0 ? 1 : Math.round(intervalDays * easeFactor)
    repetitions += 1
    easeFactor = Math.min(2.5, easeFactor + 0.1)
  }

  const nextReviewAt = new Date()
  nextReviewAt.setTime(nextReviewAt.getTime() + intervalDays * 86_400_000)

  return { easeFactor, intervalDays, repetitions, nextReviewAt }
}

export function manualIntervalDays(frequency: number, period: RepetitionPeriod): number {
  const daysInPeriod = period === "day" ? 1 : period === "week" ? 7 : 30
  return daysInPeriod / frequency
}

export function formatNextReview(nextReviewAt: Date): string {
  const diffMs = nextReviewAt.getTime() - Date.now()
  const diffDays = Math.round(diffMs / 86_400_000)
  if (diffDays <= 0) return "Today"
  if (diffDays === 1) return "Tomorrow"
  if (diffDays < 7) return `In ${diffDays} days`
  if (diffDays < 14) return "Next week"
  return `In ${Math.round(diffDays / 7)} weeks`
}

export function gradeLabel(grade: SRSGrade): string {
  if (grade === "perfect") return "Excellent"
  if (grade === "medium") return "Almost"
  return "Missed"
}
