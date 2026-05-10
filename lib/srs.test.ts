import { describe, it, expect } from "vitest"
import {
  gradeFromScore,
  computeNextSRS,
  manualIntervalDays,
  formatNextReview,
  gradeLabel,
  type SRSState,
} from "./srs"

// ─── gradeFromScore ────────────────────────────────────────────────────────────

describe("gradeFromScore", () => {
  it("returns 'perfect' at exactly 86", () => {
    expect(gradeFromScore(86)).toBe("perfect")
  })
  it("returns 'perfect' at 100", () => {
    expect(gradeFromScore(100)).toBe("perfect")
  })
  it("returns 'medium' at exactly 60", () => {
    expect(gradeFromScore(60)).toBe("medium")
  })
  it("returns 'medium' at 85 (one below perfect threshold)", () => {
    expect(gradeFromScore(85)).toBe("medium")
  })
  it("returns 'fail' at 59 (one below medium threshold)", () => {
    expect(gradeFromScore(59)).toBe("fail")
  })
  it("returns 'fail' at 0", () => {
    expect(gradeFromScore(0)).toBe("fail")
  })
})

// ─── computeNextSRS ────────────────────────────────────────────────────────────

const baseState: SRSState = { easeFactor: 2.5, intervalDays: 1, repetitions: 0 }

describe("computeNextSRS — perfect grade", () => {
  it("first perfect: intervalDays stays 1, repetitions increments", () => {
    const result = computeNextSRS(baseState, "perfect")
    expect(result.repetitions).toBe(1)
    expect(result.intervalDays).toBe(1) // repetitions was 0
    expect(result.easeFactor).toBeCloseTo(2.5) // capped at 2.5
  })

  it("second perfect: intervalDays grows by easeFactor", () => {
    const state: SRSState = { easeFactor: 2.5, intervalDays: 1, repetitions: 1 }
    const result = computeNextSRS(state, "perfect")
    expect(result.intervalDays).toBe(Math.round(1 * 2.5)) // = 3 (rounded)
    expect(result.repetitions).toBe(2)
    expect(result.easeFactor).toBeCloseTo(2.5) // capped at 2.5
  })

  it("ease factor caps at 2.5", () => {
    const state: SRSState = { easeFactor: 2.5, intervalDays: 10, repetitions: 5 }
    const result = computeNextSRS(state, "perfect")
    expect(result.easeFactor).toBeCloseTo(2.5) // already at max; 2.5 + 0.1 = 2.6 → clamped
    // Actually it WOULD exceed 2.5 unless explicitly clamped — let's check the actual code behavior
  })

  it("nextReviewAt is in the future", () => {
    const result = computeNextSRS(baseState, "perfect")
    expect(result.nextReviewAt.getTime()).toBeGreaterThan(Date.now())
  })
})

describe("computeNextSRS — medium grade", () => {
  it("intervalDays grows by 1.5x", () => {
    const state: SRSState = { easeFactor: 2.5, intervalDays: 4, repetitions: 2 }
    const result = computeNextSRS(state, "medium")
    expect(result.intervalDays).toBe(Math.max(1, 4 * 1.5)) // 6
    expect(result.repetitions).toBe(3)
    expect(result.easeFactor).toBe(2.5) // unchanged
  })

  it("intervalDays never goes below 1", () => {
    const state: SRSState = { easeFactor: 2.5, intervalDays: 0.5, repetitions: 0 }
    const result = computeNextSRS(state, "medium")
    expect(result.intervalDays).toBeGreaterThanOrEqual(1)
  })
})

describe("computeNextSRS — fail grade", () => {
  it("resets intervalDays to 1 and repetitions to 0", () => {
    const state: SRSState = { easeFactor: 2.5, intervalDays: 30, repetitions: 10 }
    const result = computeNextSRS(state, "fail")
    expect(result.intervalDays).toBe(1)
    expect(result.repetitions).toBe(0)
  })

  it("decrements easeFactor by 0.2", () => {
    const state: SRSState = { easeFactor: 2.0, intervalDays: 10, repetitions: 5 }
    const result = computeNextSRS(state, "fail")
    expect(result.easeFactor).toBeCloseTo(1.8)
  })

  it("ease factor clamps at 1.3", () => {
    const state: SRSState = { easeFactor: 1.4, intervalDays: 1, repetitions: 0 }
    const result = computeNextSRS(state, "fail")
    expect(result.easeFactor).toBe(1.3)
  })

  it("ease factor does not go below 1.3 even when already at floor", () => {
    const state: SRSState = { easeFactor: 1.3, intervalDays: 1, repetitions: 0 }
    const result = computeNextSRS(state, "fail")
    expect(result.easeFactor).toBe(1.3)
  })
})

// ─── manualIntervalDays ────────────────────────────────────────────────────────

describe("manualIntervalDays", () => {
  it("day/1 → 1 day", () => expect(manualIntervalDays(1, "day")).toBe(1))
  it("week/1 → 7 days", () => expect(manualIntervalDays(1, "week")).toBe(7))
  it("week/2 → 3.5 days", () => expect(manualIntervalDays(2, "week")).toBe(3.5))
  it("month/1 → 30 days", () => expect(manualIntervalDays(1, "month")).toBe(30))
  it("month/4 → 7.5 days", () => expect(manualIntervalDays(4, "month")).toBe(7.5))
  it("day/7 → ~0.14 days", () => expect(manualIntervalDays(7, "day")).toBeCloseTo(1 / 7))
})

// ─── formatNextReview ─────────────────────────────────────────────────────────

describe("formatNextReview", () => {
  function daysFromNow(days: number): Date {
    return new Date(Date.now() + days * 86_400_000)
  }

  it("0 days → 'Today'", () => expect(formatNextReview(daysFromNow(0))).toBe("Today"))
  it("past date → 'Today'", () => expect(formatNextReview(daysFromNow(-1))).toBe("Today"))
  it("1 day → 'Tomorrow'", () => expect(formatNextReview(daysFromNow(1))).toBe("Tomorrow"))
  it("3 days → 'In 3 days'", () => expect(formatNextReview(daysFromNow(3))).toBe("In 3 days"))
  it("6 days → 'In 6 days'", () => expect(formatNextReview(daysFromNow(6))).toBe("In 6 days"))
  it("7 days → 'Next week'", () => expect(formatNextReview(daysFromNow(7))).toBe("Next week"))
  it("14 days → 'In 2 weeks'", () => expect(formatNextReview(daysFromNow(14))).toBe("In 2 weeks"))
})

// ─── gradeLabel ───────────────────────────────────────────────────────────────

describe("gradeLabel", () => {
  it("perfect → 'Excellent'", () => expect(gradeLabel("perfect")).toBe("Excellent"))
  it("medium → 'Almost'", () => expect(gradeLabel("medium")).toBe("Almost"))
  it("fail → 'Missed'", () => expect(gradeLabel("fail")).toBe("Missed"))
})
