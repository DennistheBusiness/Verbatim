"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useSetList, useSetActions, countWords } from "@/lib/memorization-context"
import type { ChunkMode } from "@/lib/memorization-context"
import { trackEvent } from "@/lib/analytics"
import { ENCODE_STARTED, TEST_STARTED, ENCODE_METHOD_SELECTED } from "@/lib/analytics-events"
import { toast } from "sonner"
import type { MemorizationPageState, PageMode } from "../types"

export function useMemorizationPage(id: string): MemorizationPageState {
  const router = useRouter()
  const { isLoaded, sets } = useSetList()
  const {
    updateChunkMode,
    markFamiliarizeComplete,
    updateEncodeProgress,
    updateTestScore,
    updateSessionState,
    updateReviewedChunks,
    updateMarkedChunks,
    getAudioUrl,
    updateRepetitionMode,
    deleteSet,
  } = useSetActions()

  const set = useMemo(() => sets.find((s) => s.id === id), [sets, id])

  const [pageMode, setPageMode] = useState<PageMode>("view")
  const [practiceChunkIndex, setPracticeChunkIndex] = useState<number | null>(null)
  const [selectedPracticeChunkIndexes, setSelectedPracticeChunkIndexes] = useState<number[]>([])
  const [practiceQueuePosition, setPracticeQueuePosition] = useState(0)
  const [familiarizeSubView, setFamiliarizeSubView] = useState<"landing" | "reader" | "tts">("landing")
  const [familiarizeView, setFamiliarizeView] = useState<"full" | "chunks">("full")
  const [contentExpanded, setContentExpanded] = useState(true)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [showTTSPlayer, setShowTTSPlayer] = useState(false)
  const [showListenOptions, setShowListenOptions] = useState(false)
  const [showMarkedOnly, setShowMarkedOnly] = useState(false)
  const [showSystemInfo, setShowSystemInfo] = useState(false)
  const [showSharePanel, setShowSharePanel] = useState(false)
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [ttsVisited, setTtsVisited] = useState(false)
  const [readerVisited, setReaderVisited] = useState(false)
  const [shareLoading, setShareLoading] = useState(false)
  const [shareCopied, setShareCopied] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [chunkSelectPurpose, setChunkSelectPurpose] = useState<"practice" | "first-letter">("practice")
  const [practiceOverrideContent, setPracticeOverrideContent] = useState("")

  // Fetch audio URL via cached context helper (24-hour signed URL)
  useEffect(() => {
    if (set?.audioFilePath) {
      getAudioUrl(id).then(url => setAudioUrl(url))
    }
  }, [set?.id, set?.audioFilePath]) // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Stable callbacks ─────────────────────────────────────────────────────

  const handleOpenTTSPlayer = useCallback(() => {
    setPageMode("familiarize")
    setFamiliarizeSubView("tts")
    setTtsVisited(true)
  }, [])
  const handleCloseTTSPlayer = useCallback(() => setFamiliarizeSubView("landing"), [])

  const handleShare = useCallback(async () => {
    if (!set) return
    if (set.shareToken) {
      setShareUrl(`${window.location.origin}/share/${set.shareToken}`)
      setShowSharePanel(true)
      return
    }
    setShareLoading(true)
    try {
      const res = await fetch("/api/share/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ setId: set.id }),
      })
      const data = await res.json()
      if (res.ok) {
        setShareUrl(data.url)
        setShowSharePanel(true)
      } else {
        toast.error(data.error || "Failed to generate share link")
      }
    } catch {
      toast.error("Failed to generate share link")
    } finally {
      setShareLoading(false)
    }
  }, [set])

  const handleCopyShareUrl = useCallback(() => {
    if (!shareUrl) return
    navigator.clipboard.writeText(shareUrl)
    setShareCopied(true)
    setTimeout(() => setShareCopied(false), 2000)
    toast.success("Link copied!")
  }, [shareUrl])

  const handleRevokeShare = useCallback(async () => {
    if (!set) return
    try {
      await fetch("/api/share/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ setId: set.id }),
      })
      setShareUrl(null)
      setShowSharePanel(false)
      toast.success("Share link disabled")
    } catch {
      toast.error("Failed to disable share link")
    }
  }, [set])

  const handleDelete = useCallback(async () => {
    if (!set) return
    setIsDeleting(true)
    try {
      await deleteSet(set.id)
      router.push("/")
    } catch {
      toast.error("Failed to delete memorization")
      setIsDeleting(false)
    }
  }, [set, deleteSet, router])

  const handleChunkModeChange = useCallback((mode: ChunkMode) => {
    updateChunkMode(id, mode)
  }, [id, updateChunkMode])

  // Encode navigation
  const startPracticeQueue = useCallback((indexes: number[]) => {
    const normalizedIndexes = Array.from(new Set(indexes)).sort((a, b) => a - b)
    if (normalizedIndexes.length === 0) return

    // All chunks selected -> train on the full content as one 3-stage exercise
    if (normalizedIndexes.length === (set?.chunks.length ?? 0)) {
      setSelectedPracticeChunkIndexes([])
      setPracticeQueuePosition(0)
      setPracticeChunkIndex(-1)
      setPageMode("practice")
      updateSessionState(id, { currentStep: "encode", currentChunkIndex: null })
      trackEvent(ENCODE_STARTED, { set_id: id, chunk_indices: normalizedIndexes, chunk_count: normalizedIndexes.length })
      return
    }

    const firstIndex = normalizedIndexes[0]
    setSelectedPracticeChunkIndexes(normalizedIndexes)
    setPracticeQueuePosition(0)
    setPracticeChunkIndex(firstIndex)
    setPageMode("practice")
    updateSessionState(id, { currentStep: "encode", currentChunkIndex: firstIndex })
    trackEvent(ENCODE_STARTED, { set_id: id, chunk_indices: normalizedIndexes, chunk_count: normalizedIndexes.length })
  }, [id, set?.chunks.length, updateSessionState])

  const startPractice = useCallback((index: number) => {
    startPracticeQueue([index])
  }, [startPracticeQueue])

  const exitPractice = useCallback(() => {
    setPracticeChunkIndex(null)
    setPracticeQueuePosition(0)
    setPracticeOverrideContent("")
    setPageMode("chunk-select")
  }, [])

  const finishEncoding = useCallback(() => {
    setPracticeChunkIndex(null)
    setPracticeQueuePosition(0)
    setPracticeOverrideContent("")
    setPageMode("view")
    updateSessionState(id, { currentStep: null, currentChunkIndex: null, currentEncodeStage: null })
  }, [id, updateSessionState])

  const continueFromEncodeToTest = useCallback(() => {
    setPracticeChunkIndex(null)
    setPracticeQueuePosition(0)
    setPageMode("test-select")
  }, [])

  // Retry / next-chunk handlers for ProgressiveChunkEncoder
  const handleRetryEntireSelection = useCallback(() => {
    setPracticeChunkIndex(null)
    setTimeout(() => setPracticeChunkIndex(-1), 0)
  }, [])

  const handleNextChunk = useCallback(() => {
    if (selectedPracticeChunkIndexes.length === 0) return

    const nextPosition = practiceQueuePosition + 1
    const nextChunkIndex = selectedPracticeChunkIndexes[nextPosition]
    if (nextChunkIndex === undefined) return

    setPracticeQueuePosition(nextPosition)
    setPracticeChunkIndex(nextChunkIndex)
    updateSessionState(id, { currentChunkIndex: nextChunkIndex })
  }, [id, practiceQueuePosition, selectedPracticeChunkIndexes, updateSessionState])

  const handleRetryChunk = useCallback(() => {
    const idx = practiceChunkIndex
    setPracticeChunkIndex(null)
    setTimeout(() => setPracticeChunkIndex(idx), 0)
  }, [practiceChunkIndex])

  const togglePracticeChunkSelection = useCallback((index: number) => {
    setSelectedPracticeChunkIndexes((prev) => {
      if (prev.includes(index)) {
        return prev.filter((value) => value !== index)
      }
      return [...prev, index].sort((a, b) => a - b)
    })
  }, [])

  const selectAllPracticeChunks = useCallback(() => {
    if (!set) return
    setSelectedPracticeChunkIndexes(set.chunks.map((chunk) => chunk.orderIndex))
  }, [set])

  const clearPracticeChunkSelection = useCallback(() => {
    setSelectedPracticeChunkIndexes([])
  }, [])

  // Familiarize navigation
  const handleFamiliarize = useCallback(() => {
    setPageMode("familiarize")
    setFamiliarizeSubView("landing")
    updateSessionState(id, { currentStep: "familiarize", currentChunkIndex: null, currentEncodeStage: null })
  }, [id, updateSessionState])

  const startFamiliarizeReader = useCallback(() => {
    setFamiliarizeSubView("reader")
    setContentExpanded(false)
    setPageMode("familiarize")
    setReaderVisited(true)
    markFamiliarizeComplete(id)
    updateSessionState(id, { currentStep: "familiarize" })
  }, [id, markFamiliarizeComplete, updateSessionState])

  const exitFamiliarize = useCallback(() => {
    setPageMode("view")
    updateSessionState(id, { currentStep: null })
  }, [id, updateSessionState])

  const continueToEncode = useCallback(() => {
    markFamiliarizeComplete(id)
    toast.success("Progress saved")
    setChunkSelectPurpose("practice")
    setPageMode("chunk-select")
  }, [id, markFamiliarizeComplete])

  // Flashcard navigation
  const handleFlashcards = useCallback(() => {
    setPageMode("flashcards")
    setShowMarkedOnly(false)
    updateSessionState(id, { currentStep: "familiarize", currentChunkIndex: 0 })
  }, [id, updateSessionState])

  const exitFlashcards = useCallback(() => {
    setPageMode("view")
    setShowMarkedOnly(false)
    updateSessionState(id, { currentChunkIndex: null })
  }, [id, updateSessionState])

  const continueFromFlashcards = useCallback(() => {
    markFamiliarizeComplete(id)
    toast.success("Progress saved")
    setChunkSelectPurpose("practice")
    setPageMode("chunk-select")
  }, [id, markFamiliarizeComplete])

  // Encode method select navigation
  const handleEncode = useCallback(() => {
    setPageMode("encode-method-select")
    updateSessionState(id, { currentStep: "encode", currentChunkIndex: null, currentEncodeStage: null })
  }, [id, updateSessionState])

  const exitEncodeMethodSelect = useCallback(() => setPageMode("view"), [])

  const startFirstLetterMethod = useCallback(() => {
    setChunkSelectPurpose("first-letter")
    setSelectedPracticeChunkIndexes([])
    setPageMode("chunk-select")
    trackEvent(ENCODE_METHOD_SELECTED, { set_id: id, method: "first_letter", chunk_count: set?.chunks.length ?? 0 })
  }, [id, set?.chunks.length])

  const backToFirstLetterChunkSelect = useCallback(() => {
    setPageMode("chunk-select")
  }, [])

  const startCombinedPractice = useCallback((indexes: number[]) => {
    const allChunks = set?.chunks ?? []
    const ordered = [...indexes].sort((a, b) => a - b)
    const combined = ordered
      .map(idx => allChunks.find(c => c.orderIndex === idx)?.text ?? "")
      .filter(Boolean)
      .join(" ")
    setPracticeOverrideContent(combined)
    setSelectedPracticeChunkIndexes([])
    setPracticeQueuePosition(0)
    setPracticeChunkIndex(-1)
    setPageMode("practice")
    updateSessionState(id, { currentStep: "encode", currentChunkIndex: null })
    trackEvent(ENCODE_STARTED, { set_id: id, chunk_indices: indexes, chunk_count: indexes.length })
  }, [set?.chunks, id, updateSessionState])

  const startSortingGame = useCallback(() => {
    setPageMode("sorting-game")
    trackEvent(ENCODE_METHOD_SELECTED, { set_id: id, method: "sorting", chunk_count: set?.chunks.length ?? 0 })
  }, [id, set?.chunks.length])

  const exitSortingGame = useCallback(() => setPageMode("view"), [])

  const startFinishPhrase = useCallback(() => {
    setPageMode("finish-phrase")
    trackEvent(ENCODE_STARTED, { set_id: id, method: "finish_phrase", chunk_count: set?.chunks.length ?? 0 })
  }, [id, set?.chunks.length])

  const exitFinishPhrase = useCallback(() => setPageMode("view"), [])

  const finishSortingGame = useCallback(() => {
    setPageMode("view")
    updateSessionState(id, { currentStep: null })
  }, [id, updateSessionState])

  // Encode chunk-select navigation
  const exitChunkSelect = useCallback(() => setPageMode("view"), [])

  // Test navigation
  const handleTest = useCallback(() => {
    setPageMode("test-select")
    updateSessionState(id, { currentStep: "test", currentChunkIndex: null, currentEncodeStage: null })
  }, [id, updateSessionState])

  const exitTestSelect = useCallback(() => setPageMode("view"), [])

  const startFirstLetterTest = useCallback(() => {
    setPageMode("first-letter-test")
    updateSessionState(id, { currentStep: "test" })
    trackEvent(TEST_STARTED, { set_id: id, test_type: "first_letter" })
  }, [id, updateSessionState])

  const exitFirstLetterTest = useCallback(() => setPageMode("view"), [])

  const finishTesting = useCallback(() => {
    setPageMode("view")
    updateSessionState(id, { currentStep: null })
  }, [id, updateSessionState])

  const startTypingTest = useCallback(() => {
    setPageMode("typing-test")
    updateSessionState(id, { currentStep: "test" })
    trackEvent(TEST_STARTED, { set_id: id, test_type: "full_text" })
  }, [id, updateSessionState])

  const exitTypingTest = useCallback(() => setPageMode("view"), [])

  const startAudioTest = useCallback(() => {
    setPageMode("audio-test")
    updateSessionState(id, { currentStep: "test" })
    trackEvent(TEST_STARTED, { set_id: id, test_type: "audio" })
  }, [id, updateSessionState])

  const exitAudioTest = useCallback(() => setPageMode("view"), [])

  // ─── Memoized derived values ───────────────────────────────────────────────

  const chunks = useMemo(() => set?.chunks ?? [], [set])
  const wordCount = useMemo(() => countWords(set?.content ?? ""), [set])
  const hasContent = useMemo(() => chunks.length > 0 && wordCount > 0, [chunks, wordCount])

  const selectedPracticeWordCount = useMemo(
    () => selectedPracticeChunkIndexes.reduce((total, index) => {
      const chunk = chunks[index]
      return total + (chunk ? countWords(chunk.text) : 0)
    }, 0),
    [selectedPracticeChunkIndexes, chunks],
  )

  const overallCompletion = useMemo((): number => {
    if (!set) return 0
    const teachPct = set.progress.familiarizeCompleted ? 100
      : Math.min(((set.progress.reviewedChunks?.length ?? 0) / Math.max(set.chunks.length, 1)) * 100, 99)
    const trainStages = [set.progress.encode.stage1Completed, set.progress.encode.stage2Completed, set.progress.encode.stage3Completed].filter(Boolean).length
    const trainPct = Math.round((trainStages / 3) * 100)
    const testScores = [
      set.progress.tests.firstLetter.bestScore,
      set.progress.tests.fullText.bestScore,
      set.progress.tests.audioTest.bestScore,
    ].filter((s): s is number => s !== null)
    const testPct = testScores.length > 0 ? Math.max(...testScores) : 0
    return Math.round((teachPct * 0.25 + trainPct * 0.35 + testPct * 0.40))
  }, [set])

  const lastPracticedDate = useMemo((): string | null => set?.sessionState.lastVisitedAt ?? null, [set])
  const currentStreak = set?.progress.streak?.currentStreak ?? 0

  const highestTestScore = useMemo((): number => {
    if (!set) return 0
    const scores = [
      set.progress.tests.firstLetter.bestScore,
      set.progress.tests.fullText.bestScore,
      set.progress.tests.audioTest.bestScore,
    ].filter((s): s is number => s !== null)
    return scores.length > 0 ? Math.max(...scores) : 0
  }, [set])

  const stepProgress = useMemo(() => {
    if (!set) return { teach: 0, train: 0, test: 0, trainStages: 0 }
    const teach = set.progress.familiarizeCompleted ? 100
      : Math.min(((set.progress.reviewedChunks?.length ?? 0) / Math.max(set.chunks.length, 1)) * 100, 99)
    const trainStages = [set.progress.encode.stage1Completed, set.progress.encode.stage2Completed, set.progress.encode.stage3Completed].filter(Boolean).length
    const train = Math.round((trainStages / 3) * 100)
    const testScores = [
      set.progress.tests.firstLetter.bestScore,
      set.progress.tests.fullText.bestScore,
      set.progress.tests.audioTest.bestScore,
    ].filter((s): s is number => s !== null)
    const test = testScores.length > 0 ? Math.max(...testScores) : 0
    return { teach, train, test, trainStages }
  }, [set])

  const progressModuleCTA = useMemo((): { label: string; description: string; onClick: () => void } => {
    if (!set) return { label: "", description: "", onClick: () => {} }
    const hasResume = set.sessionState.currentStep !== null && set.sessionState.lastVisitedAt !== null
    if (hasResume) {
      const onResume = () => {
        const { currentStep, currentChunkIndex } = set.sessionState
        if (!currentStep) {
          switch (set.recommendedStep) {
            case "familiarize": handleFamiliarize(); break
            case "encode": handleEncode(); break
            case "test": handleTest(); break
          }
          return
        }
        switch (currentStep) {
          case "familiarize": setPageMode("familiarize"); break
          case "encode":
            if (currentChunkIndex !== null) { setPracticeChunkIndex(currentChunkIndex); setPageMode("practice") }
            else setPageMode("encode-method-select")
            break
          case "test": setPageMode("test-select"); break
          default: setPageMode("view")
        }
      }
      switch (set.sessionState.currentStep) {
        case "encode": return { label: "Resume Training", description: "Continue where you left off and keep building recall.", onClick: onResume }
        case "familiarize": return { label: "Continue Familiarizing", description: "Pick up reading practice where you left off.", onClick: onResume }
        case "test": return { label: "Resume Testing", description: "Jump back into your last test flow.", onClick: onResume }
      }
    }
    switch (set.recommendedStep) {
      case "familiarize": return { label: "Start Familiarizing", description: "Build a strong first pass before training recall.", onClick: handleFamiliarize }
      case "encode": return { label: "Start Training", description: "Begin encoding to strengthen recall accuracy.", onClick: handleEncode }
      case "test":
      default: return { label: "Take a Test", description: "Complete your first test to see your progress over time.", onClick: handleTest }
    }
  }, [set, handleFamiliarize, handleEncode, handleTest])

  const teachCTA = useMemo((): { label: string; onClick: () => void } => {
    if (!set) return { label: "", onClick: () => {} }
    const flashcardsDone = (set.progress.reviewedChunks?.length ?? 0) > 0
    if (!readerVisited) return { label: "Start Reading", onClick: startFamiliarizeReader }
    if (!flashcardsDone) return { label: "Try Flashcard Mode", onClick: handleFlashcards }
    if (!ttsVisited) return { label: "Try AI Read Aloud", onClick: handleOpenTTSPlayer }
    return { label: "Continue to Training", onClick: continueToEncode }
  }, [set, readerVisited, ttsVisited, startFamiliarizeReader, handleFlashcards, handleOpenTTSPlayer, continueToEncode])

  const trainCTA = useMemo((): { label: string; onClick: () => void } => {
    if (!set) return { label: "", onClick: () => {} }
    const firstLetterDone = set.progress.encode.stage1Completed && set.progress.encode.stage2Completed && set.progress.encode.stage3Completed
    const finishPhraseDone = (set.progress.tests.finishPhrase?.bestScore ?? null) !== null
    const sortingGameDone = (set.progress.tests.sortingGame?.bestScore ?? null) !== null
    if (!firstLetterDone) return { label: "Start First Letter Method", onClick: startFirstLetterMethod }
    if (!sortingGameDone) return { label: "Try Sorting Game", onClick: startSortingGame }
    if (!finishPhraseDone) return { label: "Try Finish That Phrase", onClick: startFinishPhrase }
    return { label: "Continue to Test", onClick: continueFromEncodeToTest }
  }, [set, startFirstLetterMethod, startSortingGame, startFinishPhrase, continueFromEncodeToTest])

  const testCTA = useMemo((): { label: string; onClick: () => void } => {
    if (!set) return { label: "", onClick: () => {} }
    const firstLetterDone = set.progress.tests.firstLetter.lastScore !== null
    const fullRecallDone = set.progress.tests.fullText.lastScore !== null
    const audioDone = set.progress.tests.audioTest.lastScore !== null
    if (!firstLetterDone) return { label: "Start First Letter Recall", onClick: startFirstLetterTest }
    if (!fullRecallDone) return { label: "Try Full Recall", onClick: startTypingTest }
    if (!audioDone) return { label: "Try Audio Recall", onClick: startAudioTest }
    return { label: "All Tests Complete · Back to Overview", onClick: exitTestSelect }
  }, [set, startFirstLetterTest, startTypingTest, startAudioTest, exitTestSelect])

  return {
    id,
    set,
    isLoaded,
    chunks,
    pageMode,
    setPageMode,
    practiceChunkIndex,
    setPracticeChunkIndex,
    selectedPracticeChunkIndexes,
    setSelectedPracticeChunkIndexes,
    practiceQueuePosition,
    setPracticeQueuePosition,
    chunkSelectPurpose,
    setChunkSelectPurpose,
    practiceOverrideContent,
    setPracticeOverrideContent,
    familiarizeSubView,
    setFamiliarizeSubView,
    familiarizeView,
    setFamiliarizeView,
    contentExpanded,
    setContentExpanded,
    ttsVisited,
    setTtsVisited,
    readerVisited,
    setReaderVisited,
    audioUrl,
    showTTSPlayer,
    setShowTTSPlayer,
    showListenOptions,
    setShowListenOptions,
    showMarkedOnly,
    setShowMarkedOnly,
    showSystemInfo,
    setShowSystemInfo,
    showSharePanel,
    setShowSharePanel,
    shareUrl,
    setShareUrl,
    shareLoading,
    shareCopied,
    isDeleting,
    wordCount,
    hasContent,
    selectedPracticeWordCount,
    overallCompletion,
    stepProgress,
    lastPracticedDate,
    currentStreak,
    highestTestScore,
    progressModuleCTA,
    teachCTA,
    trainCTA,
    testCTA,
    handleShare,
    handleCopyShareUrl,
    handleRevokeShare,
    handleDelete,
    handleOpenTTSPlayer,
    handleCloseTTSPlayer,
    handleFamiliarize,
    startFamiliarizeReader,
    exitFamiliarize,
    continueToEncode,
    handleFlashcards,
    exitFlashcards,
    continueFromFlashcards,
    handleChunkModeChange,
    togglePracticeChunkSelection,
    selectAllPracticeChunks,
    clearPracticeChunkSelection,
    handleEncode,
    exitEncodeMethodSelect,
    startFirstLetterMethod,
    backToFirstLetterChunkSelect,
    startCombinedPractice,
    startPracticeQueue,
    startPractice,
    exitPractice,
    finishEncoding,
    continueFromEncodeToTest,
    handleRetryEntireSelection,
    handleNextChunk,
    handleRetryChunk,
    exitChunkSelect,
    startSortingGame,
    exitSortingGame,
    finishSortingGame,
    startFinishPhrase,
    exitFinishPhrase,
    handleTest,
    exitTestSelect,
    startFirstLetterTest,
    exitFirstLetterTest,
    startTypingTest,
    exitTypingTest,
    startAudioTest,
    exitAudioTest,
    finishTesting,
    updateChunkMode,
    updateRepetitionMode,
    updateTestScore,
    updateReviewedChunks,
    updateMarkedChunks,
  }
}
