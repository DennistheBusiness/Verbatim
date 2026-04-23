"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import type { Database } from "@/lib/supabase/types"
import { getEffectiveUserId } from "@/lib/impersonation"

export type ChunkMode = "line" | "paragraph" | "sentence" | "custom"
export type InputMethod = "text" | "voice"

export interface Chunk {
  id: string
  orderIndex: number
  text: string
}

export interface Progress {
  familiarizeCompleted: boolean
  reviewedChunks?: string[] // Chunk IDs reviewed in flashcard mode
  markedChunks?: string[] // Chunk IDs marked for later review
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
  tags: string[]
  audioFilePath?: string | null
  originalFilename?: string | null
  createdFrom: InputMethod
}

interface MemorizationContextType {
  sets: MemorizationSet[]
  isLoaded: boolean
  isLoading: boolean
  error: string | null
  addSet: (
    title: string, 
    content: string, 
    chunkMode?: ChunkMode, 
    tags?: string[],
    audioBlob?: Blob | null,
    originalFilename?: string | null,
    createdFrom?: InputMethod
  ) => Promise<string>
  getSet: (id: string) => MemorizationSet | undefined
  updateSet: (id: string, title: string, content: string, tags?: string[], audioBlob?: Blob | null, originalFilename?: string | null, createdFrom?: InputMethod) => Promise<void>
  updateChunkMode: (id: string, mode: ChunkMode) => Promise<void>
  updateSessionState: (id: string, sessionState: Partial<SessionState>) => Promise<void>
  updateProgress: (id: string, updates: Partial<Progress>) => Promise<void>
  markFamiliarizeComplete: (id: string) => Promise<void>
  updateEncodeProgress: (id: string, stage: 1 | 2 | 3, score?: number) => Promise<void>
  updateTestScore: (id: string, testType: "firstLetter" | "fullText" | "audioTest", score: number) => Promise<void>
  updateReviewedChunks: (id: string, chunkIds: string[]) => Promise<void>
  updateMarkedChunks: (id: string, chunkIds: string[]) => Promise<void>
  updateTags: (id: string, tags: string[]) => Promise<void>
  deleteSet: (id: string) => Promise<void>
  deleteAudioFile: (audioFilePath: string) => Promise<void>
  getAllTags: () => string[]
  refreshSets: () => Promise<void>
}

const MemorizationContext = createContext<MemorizationContextType | undefined>(undefined)

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
      firstLetter: {
        bestScore: null,
        lastScore: null,
      },
      fullText: {
        bestScore: null,
        lastScore: null,
      },
      audioTest: {
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
  const audioTestScore = progress.tests.audioTest.lastScore
  
  if ((firstLetterScore !== null && firstLetterScore < 70) || 
      (fullTextScore !== null && fullTextScore < 70) ||
      (audioTestScore !== null && audioTestScore < 70)) {
    return "encode"
  }
  
  // Default: recommend test
  return "test"
}

/**
 * Parses content into paragraphs.
 * - First splits on custom separator "/" (surrounded by newlines)
 * - Then splits on one or more line breaks
 * - Trims whitespace from each paragraph
 * - Normalizes internal whitespace (multiple spaces become single space)
 * - Ignores empty chunks
 */
function parseIntoParagraphs(content: string): string[] {
  return content
    // Normalize line endings
    .replace(/\r\n/g, "\n")
    // First split on custom separator "/" with surrounding whitespace/newlines
    .split(/\n\s*\/\s*\n/)
    // Then split each section on line breaks, flattening the results
    .flatMap((section) => section.split(/\n\s*\n|\n/))
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

export function MemorizationProvider({ children }: { children: ReactNode }) {
  const [sets, setSets] = useState<MemorizationSet[]>([])
  const [isLoaded, setIsLoaded] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  // Fetch sets from Supabase
  const fetchSets = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Get current user and session
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      const { data: { session } } = await supabase.auth.getSession()
      
      // Use effective user ID (handles impersonation)
      const effectiveUserId = getEffectiveUserId(user?.id)
      
      console.log('🔍 fetchSets - User:', user?.id, user?.email)
      console.log('🎭 Effective User ID:', effectiveUserId)
      console.log('🔑 Session exists:', !!session)
      
      if (!effectiveUserId) {
        console.log('❌ No user found in session')
        setSets([])
        setIsLoaded(true)
        setIsLoading(false)
        return
      }

      // Fetch memorization sets with chunks and tags for the effective user
      const { data: setsData, error: setsError } = await supabase
        .from('memorization_sets')
        .select(`
          *,
          chunks (id, order_index, text),
          set_tags (
            tag:tags (name)
          )
        `)
        .eq('user_id', effectiveUserId)
        .order('created_at', { ascending: false })

      if (setsError) throw setsError

      // Transform database format to app format
      const transformedSets: MemorizationSet[] = (setsData || []).map((set: any) => ({
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
        tags: (set.set_tags || []).map((st: any) => st.tag.name),
        audioFilePath: set.audio_file_path || null,
        originalFilename: set.original_filename || null,
        createdFrom: (set.created_from || 'text') as InputMethod,
      }))

      console.log('✅ Transformed sets:', transformedSets.length, 'sets')
      console.log('📦 Sets data:', JSON.stringify(transformedSets, null, 2))
      setSets(transformedSets)
    } catch (err) {
      console.error('Error fetching sets:', err)
      setError(err instanceof Error ? err.message : 'Failed to load memorization sets')
      toast.error('Failed to load your memorization sets')
    } finally {
      setIsLoaded(true)
      setIsLoading(false)
    }
  }, [supabase])

  // Initial fetch
  useEffect(() => {
    fetchSets()
  }, [fetchSets])

  const addSet = useCallback(async (
    title: string, 
    content: string, 
    chunkMode: ChunkMode = "paragraph", 
    tags: string[] = [],
    audioBlob: Blob | null = null,
    originalFilename: string | null = null,
    createdFrom: InputMethod = "text"
  ): Promise<string> => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      // Use effective user ID (handles impersonation)
      const effectiveUserId = getEffectiveUserId(user?.id)
      console.log('🔍 addSet - User:', user?.id, user?.email)
      console.log('🎭 Effective User ID:', effectiveUserId)
      
      if (!effectiveUserId) throw new Error('Not authenticated')

      const id = generateId()
      const now = new Date().toISOString()
      const progress = createInitialProgress()
      const chunks = generateChunks(content, chunkMode)

      let audioFilePath: string | null = null

      // Upload audio file if provided
      if (audioBlob && createdFrom === 'voice') {
        console.log('🎙️ Attempting to upload audio:', {
          blobSize: audioBlob.size,
          blobType: audioBlob.type,
          userId: effectiveUserId,
          setId: id
        })
        
        const fileExtension = audioBlob.type.includes('webm') ? 'webm' : 'mp4'
        const fileName = `${effectiveUserId}/${id}.${fileExtension}`
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('audio-recordings')
          .upload(fileName, audioBlob, {
            contentType: audioBlob.type,
            upsert: false,
          })

        if (uploadError) {
          console.error('❌ Audio upload failed:', {
            error: uploadError,
            message: uploadError.message,
            statusCode: uploadError.statusCode
          })
          toast.error(`Failed to upload audio: ${uploadError.message}`)
          throw new Error(`Failed to upload audio file: ${uploadError.message}`)
        }

        audioFilePath = fileName
        console.log('✅ Audio uploaded successfully:', { fileName, data: uploadData })
      }

      // Insert memorization set
      const { error: setError } = await supabase
        .from('memorization_sets')
        .insert({
          id,
          user_id: effectiveUserId,
          title,
          content,
          chunk_mode: chunkMode,
          progress: progress as any,
          session_state: createInitialSessionState() as any,
          recommended_step: computeRecommendedStep(progress),
          created_at: now,
          updated_at: now,
          audio_file_path: audioFilePath,
          original_filename: originalFilename,
          created_from: createdFrom,
        })

      if (setError) {
        console.error('❌ Insert failed:', setError)
        // Clean up uploaded audio if DB insert failed
        if (audioFilePath) {
          await supabase.storage.from('audio-recordings').remove([audioFilePath])
        }
        throw setError
      }

      // Insert chunks
      if (chunks.length > 0) {
        const { error: chunksError } = await supabase
          .from('chunks')
          .insert(
            chunks.map(chunk => ({
              id: chunk.id,
              set_id: id,
              order_index: chunk.orderIndex,
              text: chunk.text,
            }))
          )

        if (chunksError) throw chunksError
      }

      // Handle tags
      if (tags.length > 0) {
        // Get or create tags
        for (const tagName of tags) {
          const { data: existingTag } = await supabase
            .from('tags')
            .select('id')
            .eq('user_id', effectiveUserId)
            .eq('name', tagName)
            .single()

          let tagId: string

          if (existingTag) {
            tagId = existingTag.id
          } else {
            const { data: newTag, error: tagError } = await supabase
              .from('tags')
              .insert({ user_id: effectiveUserId, name: tagName })
              .select('id')
              .single()

            if (tagError) throw tagError
            tagId = newTag.id
          }

          // Create set_tag relationship
          const { error: setTagError } = await supabase
            .from('set_tags')
            .insert({ set_id: id, tag_id: tagId })

          if (setTagError) throw setTagError
        }
      }

      // Refresh sets
      await fetchSets()
      toast.success('Memorization set created')
      return id
    } catch (err) {
      console.error('Error adding set:', err)
      toast.error('Failed to create memorization set')
      throw err
    }
  }, [supabase, fetchSets])

  const getSet = useCallback((id: string): MemorizationSet | undefined => {
    return sets.find((set) => set.id === id)
  }, [sets])

  const updateSet = useCallback(async (
    id: string, 
    title: string, 
    content: string, 
    tags?: string[], 
    audioBlob?: Blob | null, 
    originalFilename?: string | null, 
    createdFrom?: InputMethod
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const set = getSet(id)
      if (!set) throw new Error('Set not found')

      const hasContentChanged = set.content !== content
      const chunks = hasContentChanged ? generateChunks(content, set.chunkMode) : set.chunks

      // Handle audio file operations
      let audioFilePath = set.audioFilePath
      let audioOriginalFilename = set.originalFilename
      let audioCreatedFrom = set.createdFrom

      // If new audio is provided
      if (audioBlob && createdFrom === 'voice') {
        // Delete old audio file if it exists
        if (set.audioFilePath) {
          await deleteAudioFile(set.audioFilePath)
        }

        // Upload new audio
        const fileExtension = audioBlob.type.includes('webm') ? 'webm' : 'mp4'
        const fileName = `${user.id}/${id}.${fileExtension}`
        
        console.log('[updateSet] Uploading audio:', {
          fileName,
          blobType: audioBlob.type,
          blobSize: audioBlob.size,
          createdFrom
        })

        const { data, error: uploadError } = await supabase.storage
          .from('audio-recordings')
          .upload(fileName, audioBlob, {
            contentType: audioBlob.type,
            upsert: true
          })

        if (uploadError) {
          console.error('[updateSet] Audio upload failed:', uploadError)
          toast.error('Failed to upload audio recording')
          throw uploadError
        }

        console.log('[updateSet] Audio uploaded successfully:', data)
        audioFilePath = fileName
        audioOriginalFilename = originalFilename || 'voice-recording.webm'
        audioCreatedFrom = 'voice'
      } 
      // If switching from voice to text (no new audio, but createdFrom is text)
      else if (createdFrom === 'text' && set.audioFilePath) {
        await deleteAudioFile(set.audioFilePath)
        audioFilePath = null
        audioOriginalFilename = null
        audioCreatedFrom = 'text'
      }
      // Update createdFrom if provided without audio changes
      else if (createdFrom) {
        audioCreatedFrom = createdFrom
      }

      // Update memorization set
      const { error: updateError } = await supabase
        .from('memorization_sets')
        .update({
          title,
          content,
          audio_file_path: audioFilePath,
          original_filename: audioOriginalFilename,
          created_from: audioCreatedFrom,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)

      if (updateError) throw updateError

      // Update chunks if content changed
      if (hasContentChanged) {
        // Delete old chunks
        const { error: deleteError } = await supabase
          .from('chunks')
          .delete()
          .eq('set_id', id)

        if (deleteError) throw deleteError

        // Insert new chunks
        if (chunks.length > 0) {
          const { error: chunksError } = await supabase
            .from('chunks')
            .insert(
              chunks.map(chunk => ({
                id: chunk.id,
                set_id: id,
                order_index: chunk.orderIndex,
                text: chunk.text,
              }))
            )

          if (chunksError) throw chunksError
        }
      }

      // Update tags if provided
      if (tags !== undefined) {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Not authenticated')

        // Delete existing set_tags
        const { error: deleteTagsError } = await supabase
          .from('set_tags')
          .delete()
          .eq('set_id', id)

        if (deleteTagsError) throw deleteTagsError

        // Insert new tags
        for (const tagName of tags) {
          const { data: existingTag } = await supabase
            .from('tags')
            .select('id')
            .eq('user_id', user.id)
            .eq('name', tagName)
            .single()

          let tagId: string

          if (existingTag) {
            tagId = existingTag.id
          } else {
            const { data: newTag, error: tagError } = await supabase
              .from('tags')
              .insert({ user_id: user.id, name: tagName })
              .select('id')
              .single()

            if (tagError) throw tagError
            tagId = newTag.id
          }

          const { error: setTagError } = await supabase
            .from('set_tags')
            .insert({ set_id: id, tag_id: tagId })

          if (setTagError) throw setTagError
        }
      }

      await fetchSets()
      toast.success('Memorization set updated')
    } catch (err) {
      console.error('Error updating set:', err)
      toast.error('Failed to update memorization set')
      throw err
    }
  }, [supabase, getSet, fetchSets])

  const updateChunkMode = useCallback(async (id: string, mode: ChunkMode) => {
    try {
      const set = getSet(id)
      if (!set || set.chunkMode === mode) return

      const chunks = generateChunks(set.content, mode)

      // Update chunk mode
      const { error: updateError } = await supabase
        .from('memorization_sets')
        .update({
          chunk_mode: mode,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)

      if (updateError) throw updateError

      // Delete old chunks
      const { error: deleteError } = await supabase
        .from('chunks')
        .delete()
        .eq('set_id', id)

      if (deleteError) throw deleteError

      // Insert new chunks
      if (chunks.length > 0) {
        const { error: chunksError } = await supabase
          .from('chunks')
          .insert(
            chunks.map(chunk => ({
              id: chunk.id,
              set_id: id,
              order_index: chunk.orderIndex,
              text: chunk.text,
            }))
          )

        if (chunksError) throw chunksError
      }

      await fetchSets()
      toast.success('Chunk mode updated')
    } catch (err) {
      console.error('Error updating chunk mode:', err)
      toast.error('Failed to update chunk mode')
      throw err
    }
  }, [supabase, getSet, fetchSets])

  const updateSessionState = useCallback(async (id: string, sessionState: Partial<SessionState>) => {
    try {
      const set = getSet(id)
      if (!set) throw new Error('Set not found')

      const updatedSessionState = {
        ...set.sessionState,
        ...sessionState,
        lastVisitedAt: new Date().toISOString(),
      }

      const { error } = await supabase
        .from('memorization_sets')
        .update({
          session_state: updatedSessionState as any,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)

      if (error) throw error

      // Update local state optimistically
      setSets(prev => prev.map(s => s.id === id ? { ...s, sessionState: updatedSessionState } : s))
    } catch (err) {
      console.error('Error updating session state:', err)
      // Silent fail for session state updates
    }
  }, [supabase, getSet])

  const updateProgress = useCallback(async (id: string, updates: Partial<Progress>) => {
    try {
      const set = getSet(id)
      if (!set) throw new Error('Set not found')

      const updatedProgress = {
        ...set.progress,
        ...updates,
        // Deep merge for nested objects
        encode: updates.encode ? { ...set.progress.encode, ...updates.encode } : set.progress.encode,
        tests: updates.tests ? {
          firstLetter: updates.tests.firstLetter ? { ...set.progress.tests.firstLetter, ...updates.tests.firstLetter } : set.progress.tests.firstLetter,
          fullText: updates.tests.fullText ? { ...set.progress.tests.fullText, ...updates.tests.fullText } : set.progress.tests.fullText,
          audioTest: updates.tests.audioTest ? { ...set.progress.tests.audioTest, ...updates.tests.audioTest } : set.progress.tests.audioTest,
        } : set.progress.tests,
      }

      const updatedSessionState = {
        ...set.sessionState,
        lastVisitedAt: new Date().toISOString(),
      }

      const { error } = await supabase
        .from('memorization_sets')
        .update({
          progress: updatedProgress as any,
          session_state: updatedSessionState as any,
          recommended_step: computeRecommendedStep(updatedProgress),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)

      if (error) throw error

      // Update local state optimistically
      setSets(prev => prev.map(s => s.id === id ? {
        ...s,
        progress: updatedProgress,
        sessionState: updatedSessionState,
        recommendedStep: computeRecommendedStep(updatedProgress),
      } : s))
    } catch (err) {
      console.error('Error updating progress:', err)
      toast.error('Failed to update progress')
      throw err
    }
  }, [supabase, getSet])

  const markFamiliarizeComplete = useCallback(async (id: string) => {
    await updateProgress(id, { familiarizeCompleted: true })
  }, [updateProgress])

  const updateEncodeProgress = useCallback(async (id: string, stage: 1 | 2 | 3, score?: number) => {
    try {
      const set = getSet(id)
      if (!set) throw new Error('Set not found')

      const updates: Partial<Progress["encode"]> = {
        [`stage${stage}Completed`]: true,
      } as any
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

      const updatedSessionState = {
        ...set.sessionState,
        lastVisitedAt: new Date().toISOString(),
      }

      const { error } = await supabase
        .from('memorization_sets')
        .update({
          progress: updatedProgress as any,
          session_state: updatedSessionState as any,
          recommended_step: computeRecommendedStep(updatedProgress),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)

      if (error) throw error

      // Update local state optimistically
      setSets(prev => prev.map(s => s.id === id ? {
        ...s,
        progress: updatedProgress,
        sessionState: updatedSessionState,
        recommendedStep: computeRecommendedStep(updatedProgress),
      } : s))
    } catch (err) {
      console.error('Error updating encode progress:', err)
      toast.error('Failed to update progress')
      throw err
    }
  }, [supabase, getSet])

  const updateTestScore = useCallback(async (id: string, testType: "firstLetter" | "fullText" | "audioTest", score: number) => {
    try {
      const set = getSet(id)
      if (!set) throw new Error('Set not found')

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

      const updatedSessionState = {
        ...set.sessionState,
        lastVisitedAt: new Date().toISOString(),
      }

      const { error } = await supabase
        .from('memorization_sets')
        .update({
          progress: updatedProgress as any,
          session_state: updatedSessionState as any,
          recommended_step: computeRecommendedStep(updatedProgress),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)

      if (error) throw error

      // Update local state optimistically
      setSets(prev => prev.map(s => s.id === id ? {
        ...s,
        progress: updatedProgress,
        sessionState: updatedSessionState,
        recommendedStep: computeRecommendedStep(updatedProgress),
      } : s))
    } catch (err) {
      console.error('Error updating test score:', err)
      toast.error('Failed to update test score')
      throw err
    }
  }, [supabase, getSet])

  const updateReviewedChunks = useCallback(async (id: string, chunkIds: string[]) => {
    try {
      const set = getSet(id)
      if (!set) throw new Error('Set not found')

      const updatedProgress = {
        ...set.progress,
        reviewedChunks: chunkIds,
      }

      const { error } = await supabase
        .from('memorization_sets')
        .update({
          progress: updatedProgress as any,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)

      if (error) throw error

      // Update local state optimistically
      setSets(prev => prev.map(s => s.id === id ? {
        ...s,
        progress: updatedProgress,
      } : s))
    } catch (err) {
      console.error('Error updating reviewed chunks:', err)
      toast.error('Failed to update reviewed chunks')
      throw err
    }
  }, [supabase, getSet])

  const updateMarkedChunks = useCallback(async (id: string, chunkIds: string[]) => {
    try {
      const set = getSet(id)
      if (!set) throw new Error('Set not found')

      const updatedProgress = {
        ...set.progress,
        markedChunks: chunkIds,
      }

      const { error } = await supabase
        .from('memorization_sets')
        .update({
          progress: updatedProgress as any,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)

      if (error) throw error

      // Update local state optimistically
      setSets(prev => prev.map(s => s.id === id ? {
        ...s,
        progress: updatedProgress,
      } : s))
    } catch (err) {
      console.error('Error updating marked chunks:', err)
      toast.error('Failed to update marked chunks')
      throw err
    }
  }, [supabase, getSet])

  const deleteSet = useCallback(async (id: string) => {
    try {
      // Get the set to check for audio file
      const set = sets.find(s => s.id === id)
      
      // Delete audio file if exists
      if (set?.audioFilePath) {
        const { error: storageError } = await supabase.storage
          .from('audio-recordings')
          .remove([set.audioFilePath])
        
        if (storageError) {
          console.error('Failed to delete audio file:', storageError)
        }
      }

      const { error } = await supabase
        .from('memorization_sets')
        .delete()
        .eq('id', id)

      if (error) throw error

      await fetchSets()
      toast.success('Memorization set deleted')
    } catch (err) {
      console.error('Error deleting set:', err)
      toast.error('Failed to delete memorization set')
      throw err
    }
  }, [supabase, fetchSets, sets])

  const deleteAudioFile = useCallback(async (audioFilePath: string) => {
    try {
      const { error } = await supabase.storage
        .from('audio-recordings')
        .remove([audioFilePath])

      if (error) throw error

      toast.success('Audio file deleted')
    } catch (err) {
      console.error('Error deleting audio file:', err)
      toast.error('Failed to delete audio file')
      throw err
    }
  }, [supabase])

  const updateTags = useCallback(async (id: string, tags: string[]) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Delete existing set_tags
      const { error: deleteError } = await supabase
        .from('set_tags')
        .delete()
        .eq('set_id', id)

      if (deleteError) throw deleteError

      // Insert new tags
      for (const tagName of tags) {
        const { data: existingTag } = await supabase
          .from('tags')
          .select('id')
          .eq('user_id', user.id)
          .eq('name', tagName)
          .single()

        let tagId: string

        if (existingTag) {
          tagId = existingTag.id
        } else {
          const { data: newTag, error: tagError } = await supabase
            .from('tags')
            .insert({ user_id: user.id, name: tagName })
            .select('id')
            .single()

          if (tagError) throw tagError
          tagId = newTag.id
        }

        const { error: setTagError } = await supabase
          .from('set_tags')
          .insert({ set_id: id, tag_id: tagId })

        if (setTagError) throw setTagError
      }

      await supabase
        .from('memorization_sets')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', id)

      await fetchSets()
      toast.success('Tags updated')
    } catch (err) {
      console.error('Error updating tags:', err)
      toast.error('Failed to update tags')
      throw err
    }
  }, [supabase, fetchSets])

  const getAllTags = useCallback((): string[] => {
    const tagSet = new Set<string>()
    sets.forEach((set) => {
      set.tags.forEach((tag) => tagSet.add(tag))
    })
    return Array.from(tagSet).sort()
  }, [sets])

  const refreshSets = useCallback(async () => {
    await fetchSets()
  }, [fetchSets])

  return (
    <MemorizationContext.Provider value={{ 
      sets, 
      isLoaded,
      isLoading,
      error,
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
      getAllTags,
      deleteSet,
      deleteAudioFile,
      refreshSets,
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
