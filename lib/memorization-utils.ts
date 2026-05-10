/**
 * Pure utility functions extracted from memorization-context.tsx.
 * No React, no Supabase, no side effects — fully testable.
 */

// ─── Minimal type definitions (mirrors memorization-context.tsx) ──────────────

export type ChunkMode = "paragraph" | "sentence" | "line" | "custom"
export type RecommendedStep = "familiarize" | "encode" | "test"

export interface StreakState {
  currentStreak: number
  longestStreak: number
  lastPracticeDate: string | null
}

export interface ProgressShape {
  familiarizeCompleted: boolean
  encode: {
    stage1Completed: boolean
    stage2Completed: boolean
    stage3Completed: boolean
    lastScore: number | null
  }
  tests: {
    firstLetter: { bestScore: number | null; lastScore: number | null }
    fullText: { bestScore: number | null; lastScore: number | null }
    audioTest: { bestScore: number | null; lastScore: number | null }
    [key: string]: { bestScore: number | null; lastScore: number | null }
  }
  streak?: StreakState
}

export interface Chunk {
  id: string
  orderIndex: number
  text: string
}

export interface Chunk {
  id: string
  orderIndex: number
  text: string
}

// ─── Word count ───────────────────────────────────────────────────────────────

export function countWords(content: string): number {
  return content.trim().split(/\s+/).filter((w) => w.length > 0).length
}

// ─── Streak ──────────────────────────────────────────────────────────────────

export function computeUpdatedStreak(
  current: StreakState | undefined | null,
  today: string, // YYYY-MM-DD
): StreakState {
  const s = current ?? { currentStreak: 0, longestStreak: 0, lastPracticeDate: null }
  if (s.lastPracticeDate === today) return s
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toLocaleDateString("en-CA")
  const newCurrent = s.lastPracticeDate === yesterdayStr ? s.currentStreak + 1 : 1
  return {
    currentStreak: newCurrent,
    longestStreak: Math.max(s.longestStreak, newCurrent),
    lastPracticeDate: today,
  }
}

// ─── Recommended Step ────────────────────────────────────────────────────────

export function computeRecommendedStep(progress: ProgressShape): RecommendedStep {
  if (!progress.familiarizeCompleted) return "familiarize"

  if (
    !progress.encode.stage1Completed ||
    !progress.encode.stage2Completed ||
    !progress.encode.stage3Completed
  ) {
    return "encode"
  }

  const { firstLetter, fullText, audioTest } = progress.tests
  if (
    (firstLetter.lastScore !== null && firstLetter.lastScore < 70) ||
    (fullText.lastScore !== null && fullText.lastScore < 70) ||
    (audioTest.lastScore !== null && audioTest.lastScore < 70)
  ) {
    return "encode"
  }

  return "test"
}

// ─── Chunk parsing ────────────────────────────────────────────────────────────

export function parseIntoParagraphs(content: string): string[] {
  return content
    .replace(/\r\n/g, "\n")
    .split(/\n\s*\n+/)
    .map((p) => p.trim().replace(/\s+/g, " "))
    .filter((p) => p.length > 0)
}

export function parseIntoSentences(content: string): string[] {
  const normalized = content
    .replace(/\r\n/g, "\n")
    .replace(/\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
  return normalized
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
}

export function parseIntoLines(content: string): string[] {
  return content
    .replace(/\r\n/g, "\n")
    .split(/\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
}

export function parseCustomChunks(content: string): string[] {
  return content
    .replace(/\r\n/g, "\n")
    .split(/\/+/)
    .map((chunk) => chunk.trim())
    .filter((chunk) => chunk.length > 0)
}

export function generateChunks(content: string, mode: ChunkMode): Chunk[] {
  let texts: string[]
  switch (mode) {
    case "line":      texts = parseIntoLines(content); break
    case "paragraph": texts = parseIntoParagraphs(content); break
    case "sentence":  texts = parseIntoSentences(content); break
    case "custom":    texts = parseCustomChunks(content); break
    default:          texts = parseIntoParagraphs(content)
  }
  return texts.map((text, index) => ({ id: crypto.randomUUID(), orderIndex: index, text }))
}
