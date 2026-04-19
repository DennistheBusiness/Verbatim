"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"

const STORAGE_KEY = "memorization-sets"

export type ChunkMode = "paragraph" | "sentence"

export interface Chunk {
  id: string
  orderIndex: number
  text: string
}

export interface Progress {
  familiarizeCompleted: boolean
  encode: {
    stage1Completed: boolean
    stage2Completed: boolean
    stage3Completed: boolean
    lastScore: number | null
  }
  tests: {
    firstLetter: {
      bestScore: number | null
      lastScore: number | null
    }
    fullText: {
      bestScore: number | null
      lastScore: number | null
    }
  }
}

export interface SessionState {
  currentStep: "familiarize" | "encode" | "test" | null
  currentChunkIndex: number | null
  currentEncodeStage: 1 | 2 | 3 | null
  lastVisitedAt: string | null
}

export type RecommendedStep = "familiarize" | "encode" | "test"

export interface MemorizationSet {
  id: string
  title: string
  content: string
  createdAt: string
  updatedAt: string
  chunkMode: ChunkMode
  chunks: Chunk[]
  progress: Progress
  sessionState: SessionState
  recommendedStep: RecommendedStep
}

interface MemorizationContextType {
  sets: MemorizationSet[]
  isLoaded: boolean
  addSet: (title: string, content: string, chunkMode?: ChunkMode) => string
  getSet: (id: string) => MemorizationSet | undefined
  updateSet: (id: string, title: string, content: string) => void
  updateChunkMode: (id: string, mode: ChunkMode) => void
  updateSessionState: (id: string, sessionState: Partial<SessionState>) => void
  updateProgress: (id: string, updates: Partial<Progress>) => void
  markFamiliarizeComplete: (id: string) => void
  updateEncodeProgress: (id: string, stage: 1 | 2 | 3, score?: number) => void
  updateTestScore: (id: string, testType: "firstLetter" | "fullText", score: number) => void
  deleteSet: (id: string) => void
}

const MemorizationContext = createContext<MemorizationContextType | undefined>(undefined)

function generateId(): string {
  return crypto.randomUUID()
}

function createInitialProgress(): Progress {
  return {
    familiarizeCompleted: false,
    encode: {
      stage1Completed: false,
      stage2Completed: false,
      stage3Completed: false,
      lastScore: null,
    },
    tests: {
      firstLetter: {
        bestScore: null,
        lastScore: null,
      },
      fullText: {
        bestScore: null,
        lastScore: null,
      },
    },
  }
}

function createInitialSessionState(): SessionState {
  return {
    currentStep: null,
    currentChunkIndex: null,
    currentEncodeStage: null,
    lastVisitedAt: null,
  }
}

/**
 * Computes the recommended next step based on progress.
 * Rules:
 * - If familiarizeCompleted is false → "familiarize"
 * - Else if any encode stage is incomplete → "encode"
 * - Else → "test"
 * 
 * Additional rule:
 * - If last test score < 70 → "encode" instead of "test"
 */
function computeRecommendedStep(progress: Progress): RecommendedStep {
  // Rule 1: Familiarize first
  if (!progress.familiarizeCompleted) {
    return "familiarize"
  }
  
  // Rule 2: Complete all encode stages
  if (!progress.encode.stage1Completed || 
      !progress.encode.stage2Completed || 
      !progress.encode.stage3Completed) {
    return "encode"
  }
  
  // Rule 3: Check test scores - if any test has score < 70, recommend encode again
  const firstLetterScore = progress.tests.firstLetter.lastScore
  const fullTextScore = progress.tests.fullText.lastScore
  
  if ((firstLetterScore !== null && firstLetterScore < 70) || 
      (fullTextScore !== null && fullTextScore < 70)) {
    return "encode"
  }
  
  // Default: recommend test
  return "test"
}

/**
 * Parses content into paragraphs.
 * - Splits on one or more line breaks
 * - Trims whitespace from each paragraph
 * - Normalizes internal whitespace (multiple spaces become single space)
 * - Ignores empty chunks
 */
function parseIntoParagraphs(content: string): string[] {
  return content
    // Normalize line endings
    .replace(/\r\n/g, "\n")
    // Split on one or more line breaks (with optional whitespace between)
    .split(/\n\s*\n|\n/)
    // Trim and normalize internal whitespace
    .map((p) => p.trim().replace(/\s+/g, " "))
    // Filter out empty chunks
    .filter((p) => p.length > 0)
}

/**
 * Parses content into sentences.
 * - Splits on sentence-ending punctuation (. ? !)
 * - Preserves the punctuation with the sentence
 * - Trims whitespace from each sentence
 * - Normalizes internal whitespace
 * - Ignores empty chunks
 */
function parseIntoSentences(content: string): string[] {
  // Normalize whitespace first (replace line breaks and multiple spaces with single space)
  const normalized = content
    .replace(/\r\n/g, "\n")
    .replace(/\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
  
  // Split on sentence-ending punctuation, keeping the punctuation with the sentence
  const sentences = normalized
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
  
  return sentences
}

/**
 * Counts the total number of words in content.
 */
export function countWords(content: string): number {
  return content
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0)
    .length
}

function generateChunks(content: string, mode: ChunkMode): Chunk[] {
  const texts = mode === "paragraph" 
    ? parseIntoParagraphs(content) 
    : parseIntoSentences(content)
  
  return texts.map((text, index) => ({
    id: generateId(),
    orderIndex: index,
    text,
  }))
}

function loadFromStorage(): MemorizationSet[] {
  if (typeof window === "undefined") return []
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    
    const parsed = JSON.parse(stored)
    // Migrate old data format if needed
    return parsed.map((set: Partial<MemorizationSet> & { id: string; title: string; content: string; createdAt: string }) => {
      const needsChunkMigration = !set.chunkMode || !set.chunks
      const needsProgressMigration = !set.progress
      const needsSessionStateMigration = !set.sessionState
      const needsRecommendationMigration = !set.recommendedStep
      
      if (needsChunkMigration || needsProgressMigration || needsSessionStateMigration || needsRecommendationMigration) {
        const chunkMode: ChunkMode = set.chunkMode || "paragraph"
        const progress = set.progress || createInitialProgress()
        return {
          ...set,
          updatedAt: set.updatedAt || set.createdAt,
          chunkMode,
          chunks: set.chunks || generateChunks(set.content, chunkMode),
          progress,
          sessionState: set.sessionState || createInitialSessionState(),
          recommendedStep: set.recommendedStep || computeRecommendedStep(progress),
        }
      }
      return set as MemorizationSet
    })
  } catch {
    return []
  }
}

function saveToStorage(sets: MemorizationSet[]) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sets))
  } catch {
    // Silently fail if localStorage is unavailable
  }
}

export function MemorizationProvider({ children }: { children: ReactNode }) {
  const [sets, setSets] = useState<MemorizationSet[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setSets(loadFromStorage())
    setIsLoaded(true)
  }, [])

  useEffect(() => {
    if (isLoaded) {
      saveToStorage(sets)
    }
  }, [sets, isLoaded])

  const addSet = useCallback((title: string, content: string, chunkMode: ChunkMode = "paragraph"): string => {
    const id = generateId()
    const now = new Date().toISOString()
    const progress = createInitialProgress()
    
    const newSet: MemorizationSet = {
      id,
      title,
      content,
      createdAt: now,
      updatedAt: now,
      chunkMode,
      chunks: generateChunks(content, chunkMode),
      progress,
      sessionState: createInitialSessionState(),
      recommendedStep: computeRecommendedStep(progress),
    }
    
    setSets((prev) => [newSet, ...prev])
    return id
  }, [])

  const getSet = useCallback((id: string): MemorizationSet | undefined => {
    return sets.find((set) => set.id === id)
  }, [sets])

  const updateSet = useCallback((id: string, title: string, content: string) => {
    setSets((prev) => prev.map((set) => {
      if (set.id === id) {
        const hasContentChanged = set.content !== content
        const chunks = hasContentChanged ? generateChunks(content, set.chunkMode) : set.chunks
        
        return {
          ...set,
          title,
          content,
          chunks,
          updatedAt: new Date().toISOString(),
        }
      }
      return set
    }))
  }, [])

  const updateChunkMode = useCallback((id: string, mode: ChunkMode) => {
    setSets((prev) => prev.map((set) => {
      if (set.id === id && set.chunkMode !== mode) {
        return {
          ...set,
          chunkMode: mode,
          chunks: generateChunks(set.content, mode),
          updatedAt: new Date().toISOString(),
        }
      }
      return set
    }))
  }, [])

  const updateSessionState = useCallback((id: string, sessionState: Partial<SessionState>) => {
    setSets((prev) => prev.map((set) => {
      if (set.id === id) {
        return {
          ...set,
          sessionState: {
            ...set.sessionState,
            ...sessionState,
            lastVisitedAt: new Date().toISOString(),
          },
          updatedAt: new Date().toISOString(),
        }
      }
      return set
    }))
  }, [])

  const updateProgress = useCallback((id: string, updates: Partial<Progress>) => {
    setSets((prev) => prev.map((set) => {
      if (set.id === id) {
        const updatedProgress = {
          ...set.progress,
          ...updates,
          // Deep merge for nested objects
          encode: updates.encode ? { ...set.progress.encode, ...updates.encode } : set.progress.encode,
          tests: updates.tests ? {
            firstLetter: updates.tests.firstLetter ? { ...set.progress.tests.firstLetter, ...updates.tests.firstLetter } : set.progress.tests.firstLetter,
            fullText: updates.tests.fullText ? { ...set.progress.tests.fullText, ...updates.tests.fullText } : set.progress.tests.fullText,
          } : set.progress.tests,
        }
        
        return {
          ...set,
          progress: updatedProgress,
          recommendedStep: computeRecommendedStep(updatedProgress),
          updatedAt: new Date().toISOString(),
          sessionState: {
            ...set.sessionState,
            lastVisitedAt: new Date().toISOString(),
          },
        }
      }
      return set
    }))
  }, [])

  const markFamiliarizeComplete = useCallback((id: string) => {
    updateProgress(id, { familiarizeCompleted: true })
  }, [updateProgress])

  const updateEncodeProgress = useCallback((id: string, stage: 1 | 2 | 3, score?: number) => {
    setSets((prev) => prev.map((set) => {
      if (set.id === id) {
        const updates: Partial<Progress["encode"]> = {
          [`stage${stage}Completed`]: true,
        }
        if (score !== undefined) {
          updates.lastScore = score
        }
        
        const updatedProgress = {
          ...set.progress,
          encode: {
            ...set.progress.encode,
            ...updates,
          },
        }
        
        return {
          ...set,
          progress: updatedProgress,
          recommendedStep: computeRecommendedStep(updatedProgress),
          updatedAt: new Date().toISOString(),
          sessionState: {
            ...set.sessionState,
            lastVisitedAt: new Date().toISOString(),
          },
        }
      }
      return set
    }))
  }, [])

  const updateTestScore = useCallback((id: string, testType: "firstLetter" | "fullText", score: number) => {
    setSets((prev) => prev.map((set) => {
      if (set.id === id) {
        const currentBest = set.progress.tests[testType].bestScore
        const newBest = currentBest === null ? score : Math.max(currentBest, score)
        
        const updatedProgress = {
          ...set.progress,
          tests: {
            ...set.progress.tests,
            [testType]: {
              lastScore: score,
              bestScore: newBest,
            },
          },
        }
        
        return {
          ...set,
          progress: updatedProgress,
          recommendedStep: computeRecommendedStep(updatedProgress),
          updatedAt: new Date().toISOString(),
          sessionState: {
            ...set.sessionState,
            lastVisitedAt: new Date().toISOString(),
          },
        }
      }
      return set
    }))
  }, [])

  const deleteSet = useCallback((id: string) => {
    setSets((prev) => prev.filter((set) => set.id !== id))
  }, [])

  return (
    <MemorizationContext.Provider value={{ 
      sets, 
      isLoaded, 
      addSet, 
      getSet, 
      updateSet, 
      updateChunkMode, 
      updateSessionState,
      updateProgress,
      markFamiliarizeComplete,
      updateEncodeProgress,
      updateTestScore,
      deleteSet 
    }}>
      {children}
    </MemorizationContext.Provider>
  )
}

export function useMemorization() {
  const context = useContext(MemorizationContext)
  if (context === undefined) {
    throw new Error("useMemorization must be used within a MemorizationProvider")
  }
  return context
}
