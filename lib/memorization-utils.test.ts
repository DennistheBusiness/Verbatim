import { describe, it, expect, beforeEach } from "vitest"
import {
  computeUpdatedStreak,
  computeRecommendedStep,
  countWords,
  parseIntoParagraphs,
  parseIntoSentences,
  parseIntoLines,
  parseCustomChunks,
  generateChunks,
  type ProgressShape,
  type StreakState,
} from "./memorization-utils"

// ─── countWords ───────────────────────────────────────────────────────────────

describe("countWords", () => {
  it("counts words in normal sentence", () => expect(countWords("hello world")).toBe(2))
  it("trims leading/trailing spaces", () => expect(countWords("  hello world  ")).toBe(2))
  it("handles multiple spaces between words", () => expect(countWords("hello   world")).toBe(2))
  it("returns 0 for empty string", () => expect(countWords("")).toBe(0))
  it("returns 0 for whitespace-only string", () => expect(countWords("   ")).toBe(0))
  it("counts a single word", () => expect(countWords("hello")).toBe(1))
})

// ─── computeUpdatedStreak ─────────────────────────────────────────────────────

describe("computeUpdatedStreak", () => {
  function todayStr(): string {
    return new Date().toLocaleDateString("en-CA")
  }
  function yesterdayStr(): string {
    const d = new Date()
    d.setDate(d.getDate() - 1)
    return d.toLocaleDateString("en-CA")
  }
  function twoDaysAgoStr(): string {
    const d = new Date()
    d.setDate(d.getDate() - 2)
    return d.toLocaleDateString("en-CA")
  }

  it("null state → first practice → streak of 1", () => {
    const result = computeUpdatedStreak(null, todayStr())
    expect(result.currentStreak).toBe(1)
    expect(result.longestStreak).toBe(1)
    expect(result.lastPracticeDate).toBe(todayStr())
  })

  it("undefined state → first practice → streak of 1", () => {
    const result = computeUpdatedStreak(undefined, todayStr())
    expect(result.currentStreak).toBe(1)
  })

  it("practiced yesterday → streak increments", () => {
    const state: StreakState = { currentStreak: 3, longestStreak: 5, lastPracticeDate: yesterdayStr() }
    const result = computeUpdatedStreak(state, todayStr())
    expect(result.currentStreak).toBe(4)
    expect(result.longestStreak).toBe(5) // unchanged (4 < 5)
  })

  it("practiced yesterday → streak exceeds longestStreak → updates longest", () => {
    const state: StreakState = { currentStreak: 5, longestStreak: 5, lastPracticeDate: yesterdayStr() }
    const result = computeUpdatedStreak(state, todayStr())
    expect(result.currentStreak).toBe(6)
    expect(result.longestStreak).toBe(6)
  })

  it("skipped a day → streak resets to 1", () => {
    const state: StreakState = { currentStreak: 10, longestStreak: 10, lastPracticeDate: twoDaysAgoStr() }
    const result = computeUpdatedStreak(state, todayStr())
    expect(result.currentStreak).toBe(1)
    expect(result.longestStreak).toBe(10) // preserved
  })

  it("same day practice → returns same state (no double-count)", () => {
    const state: StreakState = { currentStreak: 3, longestStreak: 5, lastPracticeDate: todayStr() }
    const result = computeUpdatedStreak(state, todayStr())
    expect(result.currentStreak).toBe(3) // no change
    expect(result).toBe(state) // same object reference
  })
})

// ─── computeRecommendedStep ───────────────────────────────────────────────────

const baseProgress: ProgressShape = {
  familiarizeCompleted: false,
  encode: { stage1Completed: false, stage2Completed: false, stage3Completed: false, lastScore: null },
  tests: {
    firstLetter: { bestScore: null, lastScore: null },
    fullText: { bestScore: null, lastScore: null },
    audioTest: { bestScore: null, lastScore: null },
  },
}

describe("computeRecommendedStep", () => {
  it("returns 'familiarize' when familiarize not done", () => {
    expect(computeRecommendedStep(baseProgress)).toBe("familiarize")
  })

  it("returns 'encode' when familiarize done but encode stages incomplete", () => {
    const p: ProgressShape = { ...baseProgress, familiarizeCompleted: true }
    expect(computeRecommendedStep(p)).toBe("encode")
  })

  it("returns 'encode' when stage1 not done", () => {
    const p: ProgressShape = {
      ...baseProgress,
      familiarizeCompleted: true,
      encode: { stage1Completed: false, stage2Completed: true, stage3Completed: true, lastScore: null },
    }
    expect(computeRecommendedStep(p)).toBe("encode")
  })

  it("returns 'test' when all stages done and no low scores", () => {
    const p: ProgressShape = {
      ...baseProgress,
      familiarizeCompleted: true,
      encode: { stage1Completed: true, stage2Completed: true, stage3Completed: true, lastScore: 80 },
      tests: {
        firstLetter: { bestScore: 90, lastScore: 90 },
        fullText: { bestScore: 85, lastScore: 85 },
        audioTest: { bestScore: 75, lastScore: 75 },
      },
    }
    expect(computeRecommendedStep(p)).toBe("test")
  })

  it("returns 'encode' if firstLetter lastScore < 70 after full encode completion", () => {
    const p: ProgressShape = {
      ...baseProgress,
      familiarizeCompleted: true,
      encode: { stage1Completed: true, stage2Completed: true, stage3Completed: true, lastScore: 80 },
      tests: {
        firstLetter: { bestScore: 60, lastScore: 60 }, // < 70
        fullText: { bestScore: null, lastScore: null },
        audioTest: { bestScore: null, lastScore: null },
      },
    }
    expect(computeRecommendedStep(p)).toBe("encode")
  })

  it("null lastScore for tests does not trigger 'encode'", () => {
    const p: ProgressShape = {
      ...baseProgress,
      familiarizeCompleted: true,
      encode: { stage1Completed: true, stage2Completed: true, stage3Completed: true, lastScore: null },
    }
    expect(computeRecommendedStep(p)).toBe("test")
  })
})

// ─── Chunk parsers ────────────────────────────────────────────────────────────

describe("parseIntoParagraphs", () => {
  it("splits on blank lines", () => {
    const result = parseIntoParagraphs("First paragraph.\n\nSecond paragraph.")
    expect(result).toHaveLength(2)
    expect(result[0]).toBe("First paragraph.")
    expect(result[1]).toBe("Second paragraph.")
  })

  it("handles multiple blank lines between paragraphs", () => {
    const result = parseIntoParagraphs("A\n\n\n\nB")
    expect(result).toHaveLength(2)
  })

  it("collapses internal newlines within a paragraph to spaces", () => {
    const result = parseIntoParagraphs("Hello\nWorld")
    expect(result).toHaveLength(1)
    expect(result[0]).toBe("Hello World")
  })

  it("filters empty paragraphs", () => {
    expect(parseIntoParagraphs("")).toHaveLength(0)
    expect(parseIntoParagraphs("   \n\n   ")).toHaveLength(0)
  })
})

describe("parseIntoSentences", () => {
  it("splits on period-space boundary", () => {
    const result = parseIntoSentences("Hello world. Goodbye world.")
    expect(result).toHaveLength(2)
  })

  it("splits on question mark and exclamation mark", () => {
    const result = parseIntoSentences("Really? Yes! Okay.")
    expect(result).toHaveLength(3)
  })

  it("treats newlines as spaces (does not split on newlines)", () => {
    const result = parseIntoSentences("Hello\nworld. Done.")
    expect(result).toHaveLength(2)
    expect(result[0]).toBe("Hello world.")
  })

  it("filters empty results", () => {
    expect(parseIntoSentences("")).toHaveLength(0)
  })
})

describe("parseIntoLines", () => {
  it("splits on newlines", () => {
    const result = parseIntoLines("Line one\nLine two\nLine three")
    expect(result).toHaveLength(3)
  })

  it("filters empty lines", () => {
    const result = parseIntoLines("A\n\nB")
    expect(result).toHaveLength(2)
  })

  it("trims each line", () => {
    const result = parseIntoLines("  Hello  \n  World  ")
    expect(result[0]).toBe("Hello")
    expect(result[1]).toBe("World")
  })
})

describe("parseCustomChunks", () => {
  it("splits on forward slash", () => {
    const result = parseCustomChunks("Chunk one / Chunk two / Chunk three")
    expect(result).toHaveLength(3)
  })

  it("splits on multiple consecutive slashes", () => {
    const result = parseCustomChunks("A // B")
    expect(result).toHaveLength(2)
  })

  it("trims chunks", () => {
    const result = parseCustomChunks("  A  /  B  ")
    expect(result[0]).toBe("A")
    expect(result[1]).toBe("B")
  })

  it("filters empty chunks", () => {
    const result = parseCustomChunks("A / / B")
    expect(result).toHaveLength(2)
  })
})

describe("generateChunks", () => {
  it("generates chunks with orderIndex starting at 0", () => {
    const chunks = generateChunks("Para one\n\nPara two", "paragraph")
    expect(chunks[0].orderIndex).toBe(0)
    expect(chunks[1].orderIndex).toBe(1)
  })

  it("each chunk has a string id", () => {
    const chunks = generateChunks("Hello\nWorld", "line")
    chunks.forEach((c) => expect(typeof c.id).toBe("string"))
  })

  it("paragraph mode splits correctly", () => {
    const chunks = generateChunks("A\n\nB\n\nC", "paragraph")
    expect(chunks).toHaveLength(3)
    expect(chunks.map((c) => c.text)).toEqual(["A", "B", "C"])
  })

  it("line mode splits on newlines", () => {
    const chunks = generateChunks("Line 1\nLine 2", "line")
    expect(chunks).toHaveLength(2)
  })

  it("custom mode splits on /", () => {
    const chunks = generateChunks("One / Two / Three", "custom")
    expect(chunks).toHaveLength(3)
  })
})
