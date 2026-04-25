"use client"

import { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo, type ReactNode } from "react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

import { createSetSchema, updateSetSchema, formatZodError } from "@/lib/schemas"
import { sanitizeText, sanitizeTags } from "@/lib/sanitize"
import { getSupabaseErrorMessage } from "@/components/error-display"
import { identifyUser, trackSessionStart, updateUserProperties, trackEvent } from "@/lib/analytics"
import * as AnalyticsEvents from "@/lib/analytics-events"
import { computeNextSRS, gradeFromScore, manualIntervalDays, type SRSGrade } from "@/lib/srs"

export type ChunkMode = "line" | "paragraph" | "sentence" | "custom"
export type InputMethod = "text" | "voice"
export type RepetitionMode = "ai" | "manual" | "off"

export interface RepetitionConfig {
  frequency?: number
  period?: "day" | "week" | "month"
}

export interface ChunkProgressRow {
  id: string
  chunk_id: string
  set_id: string
  ease_factor: number
  interval_days: number
  repetitions: number
  last_score: number | null
  last_reviewed_at: string | null
  next_review_at: string
}
export type { TranscriptWord } from "@/app/api/transcribe/route"

export interface Chunk {
  id: string
  orderIndex: number
  text: string
}

export interface Progress {
  familiarizeCompleted: boolean
  reviewedChunks?: string[]
  markedChunks?: string[]
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
    audioTest: {
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
  repetitionMode: RepetitionMode
  repetitionConfig: RepetitionConfig
  tags: string[]
  audioFilePath?: string | null
  originalFilename?: string | null
  createdFrom: InputMethod
  transcript?: string | null
  transcriptWords?: import("@/app/api/transcribe/route").TranscriptWord[] | null
}

// ─── Context types ────────────────────────────────────────────────────────────

interface SetListContextType {
  sets: MemorizationSet[]
  hasMore: boolean
  isLoadingMore: boolean
  isLoaded: boolean
  isLoading: boolean
  error: string | null
  getAllTags: () => string[]
  loadMore: () => Promise<void>
  refreshSets: () => Promise<void>
}

interface SetActionsContextType {
  addSet: (
    title: string,
    content: string,
    chunkMode?: ChunkMode,
    tags?: string[],
    audioBlob?: Blob | null,
    originalFilename?: string | null,
    createdFrom?: InputMethod,
    transcript?: string | null,
    transcriptWords?: import("@/app/api/transcribe/route").TranscriptWord[] | null,
  ) => Promise<string>
  getSet: (id: string) => MemorizationSet | undefined
  updateSet: (id: string, title: string, content: string, tags?: string[], audioBlob?: Blob | null, originalFilename?: string | null, createdFrom?: InputMethod, transcript?: string | null, transcriptWords?: import("@/app/api/transcribe/route").TranscriptWord[] | null) => Promise<void>
  updateChunkMode: (id: string, mode: ChunkMode) => Promise<void>
  updateSessionState: (id: string, sessionState: Partial<SessionState>) => Promise<void>
  updateProgress: (id: string, updates: Partial<Progress>) => Promise<void>
  markFamiliarizeComplete: (id: string) => Promise<void>
  updateEncodeProgress: (id: string, stage: 1 | 2 | 3, score?: number) => Promise<void>
  updateTestScore: (id: string, testType: "firstLetter" | "fullText" | "audioTest", score: number, meta?: { totalWords?: number; correctWords?: number; chunkId?: string | null }) => Promise<void>
  updateReviewedChunks: (id: string, chunkIds: string[]) => Promise<void>
  updateMarkedChunks: (id: string, chunkIds: string[]) => Promise<void>
  updateTags: (id: string, tags: string[]) => Promise<void>
  deleteSet: (id: string) => Promise<void>
  deleteAudioFile: (audioFilePath: string) => Promise<void>
  getAudioUrl: (setId: string) => Promise<string | null>
  updateRepetitionMode: (setId: string, mode: RepetitionMode, config?: RepetitionConfig) => Promise<void>
  upsertChunkProgress: (setId: string, chunkId: string, score: number) => Promise<{ nextReviewAt: Date; grade: SRSGrade } | null>
  getDueChunks: (setId: string) => Promise<ChunkProgressRow[]>
}

// Combined for backward compatibility
interface MemorizationContextType extends SetListContextType, SetActionsContextType {}

// ─── Contexts ─────────────────────────────────────────────────────────────────

const SetListContext = createContext<SetListContextType | undefined>(undefined)
const SetActionsContext = createContext<SetActionsContextType | undefined>(undefined)

// ─── Pure functions ───────────────────────────────────────────────────────────

function generateId(): string {
  return crypto.randomUUID()
}

function createInitialProgress(): Progress {
  return {
    familiarizeCompleted: false,
    reviewedChunks: [],
    markedChunks: [],
    encode: {
      stage1Completed: false,
      stage2Completed: false,
      stage3Completed: false,
      lastScore: null,
    },
    tests: {
      firstLetter: { bestScore: null, lastScore: null },
      fullText: { bestScore: null, lastScore: null },
      audioTest: { bestScore: null, lastScore: null },
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

function computeRecommendedStep(progress: Progress): RecommendedStep {
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

function parseIntoParagraphs(content: string): string[] {
  return content
    .replace(/\r\n/g, "\n")
    .split(/\n\s*\n+/)
    .map((p) => p.trim().replace(/\s+/g, " "))
    .filter((p) => p.length > 0)
}

function parseIntoSentences(content: string): string[] {
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

export function countWords(content: string): number {
  return content
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0)
    .length
}

function parseIntoLines(content: string): string[] {
  return content
    .replace(/\r\n/g, "\n")
    .split(/\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
}

function parseCustomChunks(content: string): string[] {
  return content
    .replace(/\r\n/g, "\n")
    .split(/\/+/)
    .map((chunk) => chunk.trim())
    .filter((chunk) => chunk.length > 0)
}

function generateChunks(content: string, mode: ChunkMode): Chunk[] {
  let texts: string[]
  switch (mode) {
    case "line":      texts = parseIntoLines(content); break
    case "paragraph": texts = parseIntoParagraphs(content); break
    case "sentence":  texts = parseIntoSentences(content); break
    case "custom":    texts = parseCustomChunks(content); break
    default:          texts = parseIntoParagraphs(content)
  }
  return texts.map((text, index) => ({ id: generateId(), orderIndex: index, text }))
}

function transformSetRow(set: any): MemorizationSet {
  return {
    id: set.id,
    title: set.title,
    content: set.content,
    createdAt: set.created_at,
    updatedAt: set.updated_at,
    chunkMode: set.chunk_mode as ChunkMode,
    chunks: (set.chunks || [])
      .sort((a: any, b: any) => a.order_index - b.order_index)
      .map((chunk: any) => ({
        id: chunk.id,
        orderIndex: chunk.order_index,
        text: chunk.text,
      })),
    progress: (set.progress || createInitialProgress()) as Progress,
    sessionState: (set.session_state || createInitialSessionState()) as SessionState,
    recommendedStep: set.recommended_step as RecommendedStep,
    repetitionMode: (set.repetition_mode || "ai") as RepetitionMode,
    repetitionConfig: (set.repetition_config || {}) as RepetitionConfig,
    tags: (set.set_tags || []).map((st: any) => st.tag.name),
    audioFilePath: set.audio_file_path || null,
    originalFilename: set.original_filename || null,
    createdFrom: (set.created_from || "text") as InputMethod,
    transcript: set.transcript || null,
    transcriptWords: set.transcript_words || null,
  }
}

// ─── Provider ─────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20

export function MemorizationProvider({ children }: { children: ReactNode }) {
  const [sets, setSets] = useState<MemorizationSet[]>([])
  const [isLoaded, setIsLoaded] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()
  const audioUrlCache = useRef<Map<string, { url: string; expiresAt: number }>>(new Map())

  // setsRef is always in sync with the sets state.
  // Callbacks read from this ref so they don't need [sets] in their dep arrays,
  // giving them stable identities that never change after mount.
  const setsRef = useRef<MemorizationSet[]>([])

  // Helper: update both ref and state atomically
  const commitSets = useCallback((newSets: MemorizationSet[]) => {
    setsRef.current = newSets
    setSets(newSets)
  }, [])

  // Helper: apply a single-set update to the current list
  const patchSet = useCallback((id: string, updater: (s: MemorizationSet) => MemorizationSet) => {
    const newSets = setsRef.current.map((s) => (s.id === id ? updater(s) : s))
    setsRef.current = newSets
    setSets(newSets)
  }, [])

  // ─── Fetch (paginated) ─────────────────────────────────────────────────────

  const fetchSets = useCallback(async (reset = true) => {
    try {
      if (reset) setIsLoading(true)
      else setIsLoadingMore(true)
      setError(null)

      const { data: { user } } = await supabase.auth.getUser()
      const effectiveUserId = user?.id

      if (!effectiveUserId) {
        commitSets([])
        setIsLoaded(true)
        setIsLoading(false)
        setIsLoadingMore(false)
        return
      }

      if (reset && user?.id) {
        identifyUser(user.id, { email: user.email, signup_date: user.created_at })
        trackSessionStart()
      }

      const offset = reset ? 0 : setsRef.current.length

      const { data: setsData, error: setsError, count } = await supabase
        .from("memorization_sets")
        .select(
          `*, chunks (id, order_index, text), set_tags (tag:tags (name))`,
          { count: "exact" },
        )
        .eq("user_id", effectiveUserId)
        .order("created_at", { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1)

      if (setsError) throw setsError

      const transformedSets = (setsData || []).map(transformSetRow)
      const newSets = reset ? transformedSets : [...setsRef.current, ...transformedSets]
      commitSets(newSets)
      setHasMore((count ?? 0) > offset + transformedSets.length)

      if (reset && user?.id) {
        updateUserProperties({ total_sets: count ?? 0 })
      }
    } catch (err) {
      console.error("Error fetching sets:", err)
      setError(err instanceof Error ? err.message : "Failed to load memorization sets")
      toast.error(getSupabaseErrorMessage(err))
    } finally {
      setIsLoaded(true)
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }, [supabase, commitSets])

  useEffect(() => {
    fetchSets()
  }, [fetchSets])

  // ─── List actions ──────────────────────────────────────────────────────────

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoadingMore) return
    await fetchSets(false)
  }, [fetchSets, hasMore, isLoadingMore])

  const refreshSets = useCallback(async () => {
    await fetchSets(true)
  }, [fetchSets])

  const getAllTags = useCallback((): string[] => {
    const tagSet = new Set<string>()
    sets.forEach((set) => set.tags.forEach((tag) => tagSet.add(tag)))
    return Array.from(tagSet).sort()
  }, [sets])

  // ─── Set actions (stable via setsRef) ─────────────────────────────────────

  // getSet reads from ref — always fresh, never changes identity
  const getSet = useCallback((id: string): MemorizationSet | undefined => {
    return setsRef.current.find((s) => s.id === id)
  }, [])

  const addSet = useCallback(async (
    title: string,
    content: string,
    chunkMode: ChunkMode = "paragraph",
    tags: string[] = [],
    audioBlob: Blob | null = null,
    originalFilename: string | null = null,
    createdFrom: InputMethod = "text",
    transcript: string | null = null,
    transcriptWords: import("@/app/api/transcribe/route").TranscriptWord[] | null = null,
  ): Promise<string> => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const effectiveUserId = user?.id
      if (!effectiveUserId) throw new Error("Not authenticated")

      const sanitizedTitle = sanitizeText(title)
      const sanitizedContent = sanitizeText(content)
      const sanitizedTags = sanitizeTags(tags)

      const validation = createSetSchema.safeParse({
        title: sanitizedTitle,
        content: sanitizedContent,
        chunkMode,
        tags: sanitizedTags,
      })
      if (!validation.success) {
        const msg = formatZodError(validation.error)
        toast.error(msg)
        throw new Error(msg)
      }

      const { title: validTitle, content: validContent, chunkMode: validChunkMode, tags: validTags } = validation.data

      const id = generateId()
      const now = new Date().toISOString()
      const progress = createInitialProgress()
      const chunks = generateChunks(validContent, validChunkMode)

      let audioFilePath: string | null = null

      const MAX_AUDIO_SIZE = 10 * 1024 * 1024
      const ALLOWED_AUDIO_TYPES = ["audio/webm", "audio/mp4", "audio/mpeg", "audio/ogg", "audio/wav"]

      if (audioBlob && createdFrom === "voice") {
        if (audioBlob.size > MAX_AUDIO_SIZE) {
          toast.error("Audio file must be 10 MB or smaller")
          throw new Error("Audio file too large")
        }
        if (!ALLOWED_AUDIO_TYPES.some(t => audioBlob.type === t || audioBlob.type.startsWith(t + ";"))) {
          toast.error("Unsupported audio format. Please use webm, mp4, ogg, wav, or mp3.")
          throw new Error("Unsupported audio type: " + audioBlob.type)
        }

        const baseType = audioBlob.type.split(";")[0]
        const fileExtension = baseType.includes("webm") ? "webm" : baseType.includes("ogg") ? "ogg" : baseType.includes("wav") ? "wav" : "mp4"
        const fileName = `${effectiveUserId}/${id}.${fileExtension}`

        const { error: uploadError } = await supabase.storage
          .from("audio-recordings")
          .upload(fileName, audioBlob, { contentType: audioBlob.type, upsert: false })

        if (uploadError) {
          toast.error(getSupabaseErrorMessage(uploadError))
          throw new Error(`Failed to upload audio file: ${uploadError.message}`)
        }

        audioFilePath = fileName
      }

      const { error: setError } = await supabase
        .from("memorization_sets")
        .insert({
          id,
          user_id: effectiveUserId,
          title: validTitle,
          content: validContent,
          chunk_mode: validChunkMode,
          progress: progress as any,
          session_state: createInitialSessionState() as any,
          recommended_step: computeRecommendedStep(progress),
          created_at: now,
          updated_at: now,
          audio_file_path: audioFilePath,
          original_filename: originalFilename,
          created_from: createdFrom,
          transcript: transcript || null,
          transcript_words: transcriptWords ? transcriptWords as any : null,
        } as any)

      if (setError) {
        if (audioFilePath) {
          await supabase.storage.from("audio-recordings").remove([audioFilePath])
        }
        throw setError
      }

      if (chunks.length > 0) {
        const { error: chunksError } = await supabase
          .from("chunks")
          .insert(chunks.map((chunk) => ({
            id: chunk.id,
            set_id: id,
            order_index: chunk.orderIndex,
            text: chunk.text,
          })))
        if (chunksError) throw chunksError
      }

      if (validTags.length > 0) {
        for (const tagName of validTags) {
          const { data: existingTag } = await supabase
            .from("tags")
            .select("id")
            .eq("user_id", effectiveUserId)
            .eq("name", tagName)
            .single()

          let tagId: string
          if (existingTag) {
            tagId = existingTag.id
          } else {
            const { data: newTag, error: tagError } = await supabase
              .from("tags")
              .insert({ user_id: effectiveUserId, name: tagName })
              .select("id")
              .single()
            if (tagError) throw tagError
            tagId = newTag.id
          }

          const { error: setTagError } = await supabase
            .from("set_tags")
            .insert({ set_id: id, tag_id: tagId })
          if (setTagError) throw setTagError
        }
      }

      await fetchSets(true)

      trackEvent(AnalyticsEvents.MEMORIZATION_CREATED, {
        chunk_mode: validChunkMode,
        has_audio: !!audioFilePath,
        content_length: validContent.length,
        chunk_count: chunks.length,
        tags_count: validTags.length,
        created_from: createdFrom,
      })

      toast.success("Memorization set created")
      return id
    } catch (err) {
      console.error("Error adding set:", err)
      toast.error(getSupabaseErrorMessage(err))
      throw err
    }
  }, [supabase, fetchSets])

  const deleteAudioFile = useCallback(async (audioFilePath: string) => {
    try {
      const { error } = await supabase.storage
        .from("audio-recordings")
        .remove([audioFilePath])
      if (error) throw error
      toast.success("Audio file deleted")
    } catch (err) {
      console.error("Error deleting audio file:", err)
      toast.error(getSupabaseErrorMessage(err))
      throw err
    }
  }, [supabase])

  const updateSet = useCallback(async (
    id: string,
    title: string,
    content: string,
    tags?: string[],
    audioBlob?: Blob | null,
    originalFilename?: string | null,
    createdFrom?: InputMethod,
    transcript?: string | null,
    transcriptWords?: import("@/app/api/transcribe/route").TranscriptWord[] | null,
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      // Read from ref — stable, no [sets] dep needed
      const set = setsRef.current.find((s) => s.id === id)
      if (!set) throw new Error("Set not found")

      const sanitizedTitle = sanitizeText(title)
      const sanitizedContent = sanitizeText(content)
      const sanitizedTags = sanitizeTags(tags ?? [])

      const validation = updateSetSchema.safeParse({
        title: sanitizedTitle,
        content: sanitizedContent,
        tags: sanitizedTags,
      })
      if (!validation.success) {
        const msg = formatZodError(validation.error)
        toast.error(msg)
        throw new Error(msg)
      }
      const { title: validTitle, content: validContent, tags: validTags } = validation.data

      const hasContentChanged = set.content !== validContent
      const chunks = hasContentChanged ? generateChunks(validContent, set.chunkMode) : set.chunks

      let audioFilePath = set.audioFilePath
      let audioOriginalFilename = set.originalFilename
      let audioCreatedFrom = set.createdFrom

      const MAX_AUDIO_SIZE = 10 * 1024 * 1024
      const ALLOWED_AUDIO_TYPES = ["audio/webm", "audio/mp4", "audio/mpeg", "audio/ogg", "audio/wav"]

      if (audioBlob && createdFrom === "voice") {
        if (audioBlob.size > MAX_AUDIO_SIZE) {
          toast.error("Audio file must be 10 MB or smaller")
          throw new Error("Audio file too large")
        }
        if (!ALLOWED_AUDIO_TYPES.some(t => audioBlob.type === t || audioBlob.type.startsWith(t + ";"))) {
          toast.error("Unsupported audio format. Please use webm, mp4, ogg, wav, or mp3.")
          throw new Error("Unsupported audio type: " + audioBlob.type)
        }

        if (set.audioFilePath) {
          await deleteAudioFile(set.audioFilePath)
        }

        const baseType = audioBlob.type.split(";")[0]
        const fileExtension = baseType.includes("webm") ? "webm" : baseType.includes("ogg") ? "ogg" : baseType.includes("wav") ? "wav" : "mp4"
        const fileName = `${user.id}/${id}.${fileExtension}`

        const { error: uploadError } = await supabase.storage
          .from("audio-recordings")
          .upload(fileName, audioBlob, { contentType: audioBlob.type, upsert: true })

        if (uploadError) {
          toast.error(getSupabaseErrorMessage(uploadError))
          throw uploadError
        }

        audioFilePath = fileName
        audioOriginalFilename = originalFilename || "voice-recording.webm"
        audioCreatedFrom = "voice"
      } else if (createdFrom === "text" && set.audioFilePath) {
        await deleteAudioFile(set.audioFilePath)
        audioFilePath = null
        audioOriginalFilename = null
        audioCreatedFrom = "text"
      } else if (createdFrom) {
        audioCreatedFrom = createdFrom
      }

      const updatePayload: Record<string, any> = {
        title: validTitle,
        content: validContent,
        audio_file_path: audioFilePath,
        original_filename: audioOriginalFilename,
        created_from: audioCreatedFrom,
        updated_at: new Date().toISOString(),
      }
      if (transcript !== undefined) updatePayload.transcript = transcript || null
      if (transcriptWords !== undefined) updatePayload.transcript_words = transcriptWords ?? null

      const { error: updateError } = await supabase
        .from("memorization_sets")
        .update(updatePayload as any)
        .eq("id", id)

      if (updateError) throw updateError

      if (hasContentChanged) {
        const { error: deleteError } = await supabase.from("chunks").delete().eq("set_id", id)
        if (deleteError) throw deleteError

        if (chunks.length > 0) {
          const { error: chunksError } = await supabase
            .from("chunks")
            .insert(chunks.map((chunk) => ({
              id: chunk.id,
              set_id: id,
              order_index: chunk.orderIndex,
              text: chunk.text,
            })))
          if (chunksError) throw chunksError
        }
      }

      if (tags !== undefined) {
        const { data: { user: tagUser } } = await supabase.auth.getUser()
        if (!tagUser) throw new Error("Not authenticated")

        const { error: deleteTagsError } = await supabase
          .from("set_tags")
          .delete()
          .eq("set_id", id)
        if (deleteTagsError) throw deleteTagsError

        for (const tagName of validTags ?? []) {
          const { data: existingTag } = await supabase
            .from("tags")
            .select("id")
            .eq("user_id", tagUser.id)
            .eq("name", tagName)
            .single()

          let tagId: string
          if (existingTag) {
            tagId = existingTag.id
          } else {
            const { data: newTag, error: tagError } = await supabase
              .from("tags")
              .insert({ user_id: tagUser.id, name: tagName })
              .select("id")
              .single()
            if (tagError) throw tagError
            tagId = newTag.id
          }

          const { error: setTagError } = await supabase
            .from("set_tags")
            .insert({ set_id: id, tag_id: tagId })
          if (setTagError) throw setTagError
        }
      }

      await fetchSets(true)
      toast.success("Memorization set updated")
    } catch (err) {
      console.error("Error updating set:", err)
      toast.error(getSupabaseErrorMessage(err))
      throw err
    }
  }, [supabase, fetchSets, deleteAudioFile])

  const updateChunkMode = useCallback(async (id: string, mode: ChunkMode) => {
    try {
      const set = setsRef.current.find((s) => s.id === id)
      if (!set || set.chunkMode === mode) return

      const oldMode = set.chunkMode
      const oldChunkCount = set.chunks.length
      const chunks = generateChunks(set.content, mode)

      const { error: updateError } = await supabase
        .from("memorization_sets")
        .update({ chunk_mode: mode, updated_at: new Date().toISOString() })
        .eq("id", id)
      if (updateError) throw updateError

      const { error: deleteError } = await supabase.from("chunks").delete().eq("set_id", id)
      if (deleteError) throw deleteError

      if (chunks.length > 0) {
        const { error: chunksError } = await supabase
          .from("chunks")
          .insert(chunks.map((chunk) => ({
            id: chunk.id,
            set_id: id,
            order_index: chunk.orderIndex,
            text: chunk.text,
          })))
        if (chunksError) throw chunksError
      }

      trackEvent(AnalyticsEvents.CHUNK_MODE_CHANGED, {
        set_id: id,
        old_mode: oldMode,
        new_mode: mode,
        chunk_count_before: oldChunkCount,
        chunk_count_after: chunks.length,
      })

      await fetchSets(true)
      toast.success("Chunk mode updated")
    } catch (err) {
      console.error("Error updating chunk mode:", err)
      toast.error(getSupabaseErrorMessage(err))
      throw err
    }
  }, [supabase, fetchSets])

  const updateSessionState = useCallback(async (id: string, sessionState: Partial<SessionState>) => {
    try {
      const set = setsRef.current.find((s) => s.id === id)
      if (!set) throw new Error("Set not found")

      const updatedSessionState = {
        ...set.sessionState,
        ...sessionState,
        lastVisitedAt: new Date().toISOString(),
      }

      const { error } = await supabase
        .from("memorization_sets")
        .update({
          session_state: updatedSessionState as any,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
      if (error) throw error

      patchSet(id, (s) => ({ ...s, sessionState: updatedSessionState }))
    } catch (err) {
      console.error("Error updating session state:", err)
      // Silent fail for session state
    }
  }, [supabase, patchSet])

  const updateProgress = useCallback(async (id: string, updates: Partial<Progress>) => {
    try {
      const set = setsRef.current.find((s) => s.id === id)
      if (!set) throw new Error("Set not found")

      const updatedProgress = {
        ...set.progress,
        ...updates,
        encode: updates.encode
          ? { ...set.progress.encode, ...updates.encode }
          : set.progress.encode,
        tests: updates.tests
          ? {
              firstLetter: updates.tests.firstLetter
                ? { ...set.progress.tests.firstLetter, ...updates.tests.firstLetter }
                : set.progress.tests.firstLetter,
              fullText: updates.tests.fullText
                ? { ...set.progress.tests.fullText, ...updates.tests.fullText }
                : set.progress.tests.fullText,
              audioTest: updates.tests.audioTest
                ? { ...set.progress.tests.audioTest, ...updates.tests.audioTest }
                : set.progress.tests.audioTest,
            }
          : set.progress.tests,
      }

      const updatedSessionState = {
        ...set.sessionState,
        lastVisitedAt: new Date().toISOString(),
      }

      const { error } = await supabase
        .from("memorization_sets")
        .update({
          progress: updatedProgress as any,
          session_state: updatedSessionState as any,
          recommended_step: computeRecommendedStep(updatedProgress),
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
      if (error) throw error

      patchSet(id, (s) => ({
        ...s,
        progress: updatedProgress,
        sessionState: updatedSessionState,
        recommendedStep: computeRecommendedStep(updatedProgress),
      }))
    } catch (err) {
      console.error("Error updating progress:", err)
      toast.error(getSupabaseErrorMessage(err))
      throw err
    }
  }, [supabase, patchSet])

  const markFamiliarizeComplete = useCallback(async (id: string) => {
    const set = setsRef.current.find((s) => s.id === id)
    await updateProgress(id, { familiarizeCompleted: true })

    if (set) {
      const timeSpent = set.sessionState.lastVisitedAt
        ? AnalyticsEvents.getTimeDifferenceSeconds(set.sessionState.lastVisitedAt)
        : 0
      trackEvent(AnalyticsEvents.FAMILIARIZE_COMPLETED, {
        set_id: id,
        chunk_count: set.chunks.length,
        time_spent_seconds: timeSpent,
      })
    }
  }, [updateProgress])

  const updateEncodeProgress = useCallback(async (id: string, stage: 1 | 2 | 3, score?: number) => {
    try {
      const set = setsRef.current.find((s) => s.id === id)
      if (!set) throw new Error("Set not found")

      const updates: Partial<Progress["encode"]> = { [`stage${stage}Completed`]: true } as any
      if (score !== undefined) updates.lastScore = score

      const updatedProgress = {
        ...set.progress,
        encode: { ...set.progress.encode, ...updates },
      }

      const updatedSessionState = {
        ...set.sessionState,
        lastVisitedAt: new Date().toISOString(),
      }

      const { error } = await supabase
        .from("memorization_sets")
        .update({
          progress: updatedProgress as any,
          session_state: updatedSessionState as any,
          recommended_step: computeRecommendedStep(updatedProgress),
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
      if (error) throw error

      patchSet(id, (s) => ({
        ...s,
        progress: updatedProgress,
        sessionState: updatedSessionState,
        recommendedStep: computeRecommendedStep(updatedProgress),
      }))

      const timeSpent = set.sessionState.lastVisitedAt
        ? AnalyticsEvents.getTimeDifferenceSeconds(set.sessionState.lastVisitedAt)
        : 0
      trackEvent(AnalyticsEvents.ENCODE_COMPLETED, {
        set_id: id,
        stage,
        score: score || 0,
        time_spent_seconds: timeSpent,
      })
    } catch (err) {
      console.error("Error updating encode progress:", err)
      toast.error(getSupabaseErrorMessage(err))
      throw err
    }
  }, [supabase, patchSet])

  const updateTestScore = useCallback(async (id: string, testType: "firstLetter" | "fullText" | "audioTest", score: number, meta?: { totalWords?: number; correctWords?: number; chunkId?: string | null }) => {
    try {
      const set = setsRef.current.find((s) => s.id === id)
      if (!set) throw new Error("Set not found")

      const currentBest = set.progress.tests[testType].bestScore
      const newBest = currentBest === null ? score : Math.max(currentBest, score)
      const isBestScore = score === newBest
      const improvement = currentBest !== null ? ((score - currentBest) / currentBest) * 100 : 0

      const updatedProgress = {
        ...set.progress,
        tests: {
          ...set.progress.tests,
          [testType]: { lastScore: score, bestScore: newBest },
        },
      }

      const updatedSessionState = {
        ...set.sessionState,
        lastVisitedAt: new Date().toISOString(),
      }

      const { error } = await supabase
        .from("memorization_sets")
        .update({
          progress: updatedProgress as any,
          session_state: updatedSessionState as any,
          recommended_step: computeRecommendedStep(updatedProgress),
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
      if (error) throw error

      // Record historical attempt (fire-and-forget — never block the progress save)
      const modeMap: Record<typeof testType, string> = {
        firstLetter: 'first_letter',
        fullText: 'full_text',
        audioTest: 'audio',
      }
      supabase
        .from('test_attempts')
        .insert({
          set_id: id,
          mode: modeMap[testType],
          score,
          total_words: meta?.totalWords ?? 0,
          correct_words: meta?.correctWords ?? 0,
          chunk_id: meta?.chunkId ?? null,
        })
        .then(({ error: insertError }) => {
          if (insertError) {
            console.error('Error recording test attempt:', insertError)
            if (process.env.NODE_ENV === 'development') {
              toast.error(`test_attempts insert failed: ${insertError.message}`)
            }
          }
        })

      patchSet(id, (s) => ({
        ...s,
        progress: updatedProgress,
        sessionState: updatedSessionState,
        recommendedStep: computeRecommendedStep(updatedProgress),
      }))

      const durationSeconds = set.sessionState.lastVisitedAt
        ? AnalyticsEvents.getTimeDifferenceSeconds(set.sessionState.lastVisitedAt)
        : 0
      trackEvent(AnalyticsEvents.TEST_COMPLETED, {
        set_id: id,
        test_type: testType === "firstLetter" ? "first_letter" : testType === "fullText" ? "full_text" : "audio",
        score,
        duration_seconds: durationSeconds,
        is_best_score: isBestScore,
        improvement_percentage: currentBest !== null ? improvement : undefined,
        chunk_count: set.chunks.length,
      })
      trackEvent(AnalyticsEvents.PRACTICE_SESSION, { activity_type: "test", set_id: id })
    } catch (err) {
      console.error("Error updating test score:", err)
      toast.error(getSupabaseErrorMessage(err))
      throw err
    }
  }, [supabase, patchSet])

  const updateReviewedChunks = useCallback(async (id: string, chunkIds: string[]) => {
    try {
      const set = setsRef.current.find((s) => s.id === id)
      if (!set) throw new Error("Set not found")

      const updatedProgress = { ...set.progress, reviewedChunks: chunkIds }

      const { error } = await supabase
        .from("memorization_sets")
        .update({ progress: updatedProgress as any, updated_at: new Date().toISOString() })
        .eq("id", id)
      if (error) throw error

      patchSet(id, (s) => ({ ...s, progress: updatedProgress }))
    } catch (err) {
      console.error("Error updating reviewed chunks:", err)
      toast.error(getSupabaseErrorMessage(err))
      throw err
    }
  }, [supabase, patchSet])

  const updateMarkedChunks = useCallback(async (id: string, chunkIds: string[]) => {
    try {
      const set = setsRef.current.find((s) => s.id === id)
      if (!set) throw new Error("Set not found")

      const updatedProgress = { ...set.progress, markedChunks: chunkIds }

      const { error } = await supabase
        .from("memorization_sets")
        .update({ progress: updatedProgress as any, updated_at: new Date().toISOString() })
        .eq("id", id)
      if (error) throw error

      patchSet(id, (s) => ({ ...s, progress: updatedProgress }))
    } catch (err) {
      console.error("Error updating marked chunks:", err)
      toast.error(getSupabaseErrorMessage(err))
      throw err
    }
  }, [supabase, patchSet])

  const updateTags = useCallback(async (id: string, tags: string[]) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const { error: deleteError } = await supabase.from("set_tags").delete().eq("set_id", id)
      if (deleteError) throw deleteError

      for (const tagName of tags) {
        const { data: existingTag } = await supabase
          .from("tags")
          .select("id")
          .eq("user_id", user.id)
          .eq("name", tagName)
          .single()

        let tagId: string
        if (existingTag) {
          tagId = existingTag.id
        } else {
          const { data: newTag, error: tagError } = await supabase
            .from("tags")
            .insert({ user_id: user.id, name: tagName })
            .select("id")
            .single()
          if (tagError) throw tagError
          tagId = newTag.id
        }

        const { error: setTagError } = await supabase
          .from("set_tags")
          .insert({ set_id: id, tag_id: tagId })
        if (setTagError) throw setTagError
      }

      await supabase
        .from("memorization_sets")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", id)

      await fetchSets(true)
      toast.success("Tags updated")
    } catch (err) {
      console.error("Error updating tags:", err)
      toast.error(getSupabaseErrorMessage(err))
      throw err
    }
  }, [supabase, fetchSets])

  const deleteSet = useCallback(async (id: string) => {
    try {
      const set = setsRef.current.find((s) => s.id === id)

      const setAgeInDays = set ? AnalyticsEvents.getTimeDifferenceDays(set.createdAt) : 0

      let completionPercentage = 0
      if (set) {
        let completed = 0
        const total = 7
        if (set.progress.familiarizeCompleted) completed++
        if (set.progress.encode.stage1Completed) completed++
        if (set.progress.encode.stage2Completed) completed++
        if (set.progress.encode.stage3Completed) completed++
        if (set.progress.tests.firstLetter.bestScore !== null) completed++
        if (set.progress.tests.fullText.bestScore !== null) completed++
        if (set.progress.tests.audioTest.bestScore !== null) completed++
        completionPercentage = Math.round((completed / total) * 100)
      }

      if (set?.audioFilePath) {
        const { error: storageError } = await supabase.storage
          .from("audio-recordings")
          .remove([set.audioFilePath])
        if (storageError) console.error("Failed to delete audio file:", storageError)
      }

      const { error } = await supabase.from("memorization_sets").delete().eq("id", id)
      if (error) throw error

      trackEvent(AnalyticsEvents.MEMORIZATION_DELETED, {
        set_id: id,
        set_age_days: setAgeInDays,
        completion_percentage: completionPercentage,
        had_audio: !!set?.audioFilePath,
        chunk_count: set?.chunks.length || 0,
      })

      await fetchSets(true)
      toast.success("Memorization set deleted")
    } catch (err) {
      console.error("Error deleting set:", err)
      toast.error(getSupabaseErrorMessage(err))
      throw err
    }
  }, [supabase, fetchSets])

  const getAudioUrl = useCallback(async (setId: string): Promise<string | null> => {
    const set = setsRef.current.find((s) => s.id === setId)
    if (!set?.audioFilePath) return null

    const cached = audioUrlCache.current.get(setId)
    const now = Date.now()
    if (cached && cached.expiresAt - now > 5 * 60 * 1000) return cached.url

    const EXPIRY_SECONDS = 24 * 60 * 60
    const { data } = await supabase.storage
      .from("audio-recordings")
      .createSignedUrl(set.audioFilePath, EXPIRY_SECONDS)

    if (!data?.signedUrl) return null

    audioUrlCache.current.set(setId, {
      url: data.signedUrl,
      expiresAt: now + EXPIRY_SECONDS * 1000,
    })

    return data.signedUrl
  }, [supabase])

  // ─── Spaced Repetition ────────────────────────────────────────────────────

  const updateRepetitionMode = useCallback(async (setId: string, mode: RepetitionMode, config?: RepetitionConfig) => {
    try {
      const { error } = await supabase
        .from("memorization_sets")
        .update({ repetition_mode: mode, repetition_config: (config ?? {}) as Record<string, unknown> })
        .eq("id", setId)
      if (error) throw error
      patchSet(setId, (s) => ({ ...s, repetitionMode: mode, repetitionConfig: config ?? {} }))

      // When switching to manual mode, reschedule all existing chunk_progress rows
      // for this set so reviews start appearing at the new frequency immediately.
      if (mode === "manual" && config?.frequency && config?.period) {
        const intervalMs = manualIntervalDays(config.frequency, config.period) * 86_400_000
        const { data: rows } = await supabase
          .from("chunk_progress")
          .select("id, last_reviewed_at")
          .eq("set_id", setId)

        if (rows && rows.length > 0) {
          await Promise.all(
            rows.map((row) => {
              const base = row.last_reviewed_at ? new Date(row.last_reviewed_at).getTime() : Date.now()
              const nextReviewAt = new Date(base + intervalMs).toISOString()
              return supabase
                .from("chunk_progress")
                .update({ next_review_at: nextReviewAt, interval_days: manualIntervalDays(config.frequency!, config.period!) })
                .eq("id", row.id)
            })
          )
        }
      }
    } catch (err) {
      console.error("Error updating repetition mode:", err)
      toast.error(getSupabaseErrorMessage(err))
      throw err
    }
  }, [supabase, patchSet])

  const upsertChunkProgress = useCallback(async (
    setId: string,
    chunkId: string,
    score: number,
  ): Promise<{ nextReviewAt: Date; grade: SRSGrade } | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null

      const set = setsRef.current.find((s) => s.id === setId)
      if (!set || set.repetitionMode === "off") return null

      // Fetch existing state for this chunk
      const { data: existing } = await supabase
        .from("chunk_progress")
        .select("ease_factor, interval_days, repetitions")
        .eq("user_id", user.id)
        .eq("chunk_id", chunkId)
        .maybeSingle()

      const currentState = {
        easeFactor: existing?.ease_factor ?? 2.5,
        intervalDays: existing?.interval_days ?? 1,
        repetitions: existing?.repetitions ?? 0,
      }

      const grade = gradeFromScore(score)
      const next = computeNextSRS(currentState, grade)

      // Manual mode overrides the interval but keeps SM-2 stats for display
      const intervalDays = set.repetitionMode === "manual" && set.repetitionConfig.frequency && set.repetitionConfig.period
        ? manualIntervalDays(set.repetitionConfig.frequency, set.repetitionConfig.period)
        : next.intervalDays

      const nextReviewAt = new Date()
      nextReviewAt.setTime(nextReviewAt.getTime() + intervalDays * 86_400_000)

      await supabase
        .from("chunk_progress")
        .upsert({
          user_id: user.id,
          set_id: setId,
          chunk_id: chunkId,
          ease_factor: next.easeFactor,
          interval_days: intervalDays,
          repetitions: next.repetitions,
          last_score: score,
          last_reviewed_at: new Date().toISOString(),
          next_review_at: nextReviewAt.toISOString(),
        }, { onConflict: "user_id,chunk_id" })

      return { nextReviewAt, grade }
    } catch (err) {
      console.error("Error upserting chunk progress:", err)
      return null
    }
  }, [supabase])

  const getDueChunks = useCallback(async (setId: string): Promise<ChunkProgressRow[]> => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []
      const { data, error } = await supabase
        .from("chunk_progress")
        .select("id, chunk_id, set_id, ease_factor, interval_days, repetitions, last_score, last_reviewed_at, next_review_at")
        .eq("set_id", setId)
        .eq("user_id", user.id)
        .lte("next_review_at", new Date().toISOString())
        .order("ease_factor", { ascending: true })
      if (error) throw error
      return (data ?? []) as ChunkProgressRow[]
    } catch (err) {
      console.error("Error fetching due chunks:", err)
      return []
    }
  }, [supabase])

  // ─── Memoized context values ───────────────────────────────────────────────

  // List context re-creates only when list state changes (sets, loading, pagination)
  const listValue = useMemo<SetListContextType>(() => ({
    sets,
    hasMore,
    isLoadingMore,
    isLoaded,
    isLoading,
    error,
    getAllTags,
    loadMore,
    refreshSets,
  }), [sets, hasMore, isLoadingMore, isLoaded, isLoading, error, getAllTags, loadMore, refreshSets])

  // Actions context: all callbacks are stable (setsRef pattern) so this is created once
  const actionsValue = useMemo<SetActionsContextType>(() => ({
    addSet,
    getSet,
    updateSet,
    updateChunkMode,
    updateSessionState,
    updateProgress,
    markFamiliarizeComplete,
    updateEncodeProgress,
    updateTestScore,
    updateReviewedChunks,
    updateMarkedChunks,
    updateTags,
    deleteSet,
    deleteAudioFile,
    getAudioUrl,
    updateRepetitionMode,
    upsertChunkProgress,
    getDueChunks,
  }), [
    addSet, getSet, updateSet, updateChunkMode, updateSessionState, updateProgress,
    markFamiliarizeComplete, updateEncodeProgress, updateTestScore, updateReviewedChunks,
    updateMarkedChunks, updateTags, deleteSet, deleteAudioFile, getAudioUrl,
    updateRepetitionMode, upsertChunkProgress, getDueChunks,
  ])

  return (
    <SetListContext.Provider value={listValue}>
      <SetActionsContext.Provider value={actionsValue}>
        {children}
      </SetActionsContext.Provider>
    </SetListContext.Provider>
  )
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useSetList(): SetListContextType {
  const context = useContext(SetListContext)
  if (!context) throw new Error("useSetList must be used within MemorizationProvider")
  return context
}

export function useSetActions(): SetActionsContextType {
  const context = useContext(SetActionsContext)
  if (!context) throw new Error("useSetActions must be used within MemorizationProvider")
  return context
}

// Backward-compatible combined hook — existing consumers need no changes
export function useMemorization(): MemorizationContextType {
  return { ...useSetList(), ...useSetActions() }
}
