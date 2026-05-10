import type { Dispatch, SetStateAction } from "react"
import type { MemorizationSet, Chunk, ChunkMode, RepetitionMode, RepetitionConfig } from "@/lib/memorization-context"

export type PageMode =
  | "view"
  | "familiarize"
  | "flashcards"
  | "chunk-select"
  | "practice"
  | "test-select"
  | "first-letter-test"
  | "typing-test"
  | "audio-test"
  | "encode-method-select"
  | "sorting-game"
  | "finish-phrase"

export type StepStatus = "not-started" | "in-progress" | "complete"

export interface MemorizationPageState {
  // Identity
  id: string

  // Loading / data
  set: MemorizationSet | undefined
  isLoaded: boolean
  chunks: Chunk[]

  // Navigation state
  pageMode: PageMode
  setPageMode: (mode: PageMode) => void
  practiceChunkIndex: number | null
  setPracticeChunkIndex: (index: number | null) => void
  selectedPracticeChunkIndexes: number[]
  setSelectedPracticeChunkIndexes: Dispatch<SetStateAction<number[]>>
  practiceQueuePosition: number
  setPracticeQueuePosition: (pos: number) => void
  chunkSelectPurpose: "practice" | "first-letter"
  setChunkSelectPurpose: (purpose: "practice" | "first-letter") => void
  practiceOverrideContent: string
  setPracticeOverrideContent: (content: string) => void

  // Familiarize state
  familiarizeSubView: "landing" | "reader" | "tts"
  setFamiliarizeSubView: (view: "landing" | "reader" | "tts") => void
  familiarizeView: "full" | "chunks"
  setFamiliarizeView: (view: "full" | "chunks") => void
  contentExpanded: boolean
  setContentExpanded: (expanded: boolean) => void
  ttsVisited: boolean
  setTtsVisited: (visited: boolean) => void
  readerVisited: boolean
  setReaderVisited: (visited: boolean) => void

  // Audio state
  audioUrl: string | null
  showTTSPlayer: boolean
  setShowTTSPlayer: (show: boolean) => void
  showListenOptions: boolean
  setShowListenOptions: (show: boolean) => void

  // UI / Modal state
  showMarkedOnly: boolean
  setShowMarkedOnly: (show: boolean) => void
  showSystemInfo: boolean
  setShowSystemInfo: (show: boolean) => void
  showSharePanel: boolean
  setShowSharePanel: (show: boolean) => void
  shareUrl: string | null
  setShareUrl: (url: string | null) => void
  shareLoading: boolean
  shareCopied: boolean
  isDeleting: boolean

  // Derived / memoized
  wordCount: number
  hasContent: boolean
  selectedPracticeWordCount: number
  overallCompletion: number
  stepProgress: { teach: number; train: number; test: number; trainStages: number }
  lastPracticedDate: string | null
  currentStreak: number
  highestTestScore: number
  progressModuleCTA: { label: string; description: string; onClick: () => void }
  teachCTA: { label: string; onClick: () => void }
  trainCTA: { label: string; onClick: () => void }
  testCTA: { label: string; onClick: () => void }

  // Share / Delete callbacks
  handleShare: () => Promise<void>
  handleCopyShareUrl: () => void
  handleRevokeShare: () => Promise<void>
  handleDelete: () => Promise<void>

  // Familiarize flow
  handleOpenTTSPlayer: () => void
  handleCloseTTSPlayer: () => void
  handleFamiliarize: () => void
  startFamiliarizeReader: () => void
  exitFamiliarize: () => void
  continueToEncode: () => void

  // Flashcard flow
  handleFlashcards: () => void
  exitFlashcards: () => void
  continueFromFlashcards: () => void

  // Chunk mode + selection
  handleChunkModeChange: (mode: ChunkMode) => void
  togglePracticeChunkSelection: (index: number) => void
  selectAllPracticeChunks: () => void
  clearPracticeChunkSelection: () => void

  // Encode flow
  handleEncode: () => void
  exitEncodeMethodSelect: () => void
  startFirstLetterMethod: () => void
  backToFirstLetterChunkSelect: () => void
  startCombinedPractice: (indexes: number[]) => void
  startPracticeQueue: (indexes: number[]) => void
  startPractice: (index: number) => void
  exitPractice: () => void
  finishEncoding: () => void
  continueFromEncodeToTest: () => void
  handleRetryEntireSelection: () => void
  handleNextChunk: () => void
  handleRetryChunk: () => void
  exitChunkSelect: () => void

  // Sorting Game + Finish Phrase
  startSortingGame: () => void
  exitSortingGame: () => void
  finishSortingGame: () => void
  startFinishPhrase: () => void
  exitFinishPhrase: () => void

  // Test flow
  handleTest: () => void
  exitTestSelect: () => void
  startFirstLetterTest: () => void
  exitFirstLetterTest: () => void
  startTypingTest: () => void
  exitTypingTest: () => void
  startAudioTest: () => void
  exitAudioTest: () => void
  finishTesting: () => void

  // Context action passthroughs (needed by HubView inline JSX)
  updateChunkMode: (id: string, mode: ChunkMode) => void
  updateRepetitionMode: (id: string, mode: RepetitionMode, config?: RepetitionConfig) => void
  updateTestScore: (id: string, testType: string, score: number) => void
  updateReviewedChunks: (id: string, chunkIds: string[]) => void
  updateMarkedChunks: (id: string, chunkIds: string[]) => void
}
