"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"

const STORAGE_KEY = "memorization-sets"

export type ChunkMode = "paragraph" | "sentence"

export interface Chunk {
  id: string
  orderIndex: number
  text: string
}

export interface MemorizationSet {
  id: string
  title: string
  content: string
  createdAt: string
  updatedAt: string
  chunkMode: ChunkMode
  chunks: Chunk[]
}

interface MemorizationContextType {
  sets: MemorizationSet[]
  isLoaded: boolean
  addSet: (title: string, content: string, chunkMode?: ChunkMode) => string
  getSet: (id: string) => MemorizationSet | undefined
  updateSet: (id: string, title: string, content: string) => void
  updateChunkMode: (id: string, mode: ChunkMode) => void
  deleteSet: (id: string) => void
}

const MemorizationContext = createContext<MemorizationContextType | undefined>(undefined)

function generateId(): string {
  return crypto.randomUUID()
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
      if (!set.chunkMode || !set.chunks) {
        const chunkMode: ChunkMode = "paragraph"
        return {
          ...set,
          updatedAt: set.updatedAt || set.createdAt,
          chunkMode,
          chunks: generateChunks(set.content, chunkMode),
        }
      }
      return set
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
    
    const newSet: MemorizationSet = {
      id,
      title,
      content,
      createdAt: now,
      updatedAt: now,
      chunkMode,
      chunks: generateChunks(content, chunkMode),
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

  const deleteSet = useCallback((id: string) => {
    setSets((prev) => prev.filter((set) => set.id !== id))
  }, [])

  return (
    <MemorizationContext.Provider value={{ sets, isLoaded, addSet, getSet, updateSet, updateChunkMode, deleteSet }}>
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
