"use client"

import { use, useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Header } from "@/components/header"
import { useSetList, useSetActions, countWords, type ChunkMode } from "@/lib/memorization-context"
import { trackEvent } from "@/lib/analytics"
import { ENCODE_STARTED, TEST_STARTED, ENCODE_METHOD_SELECTED } from "@/lib/analytics-events"
import { SortingGame } from "@/components/sorting-game"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty"
import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import { Card, CardContent } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { AlertCircle, FileText, Layers, Type, Keyboard, LetterText, BookOpen, ArrowRight, CheckCircle2, Clock, Trophy, Target, Sparkles, BookMarked, Volume2, Headphones, Edit3, Mic, ChevronDown, ChevronUp, Bookmark, X, HelpCircle, Share2, Copy, Check, MessageSquare, Mail, LinkIcon, BarChart3 } from "lucide-react"
import { toast } from "sonner"
import { TimedAudioPlayer } from "@/components/timed-audio-player"
import { ProgressiveChunkEncoder } from "@/components/progressive-chunk-encoder"
import { TypingTest } from "@/components/typing-test"
import { FullFirstLetterTest } from "@/components/full-first-letter-test"
import { SessionLayout } from "@/components/session-layout"
import { FlashcardViewer } from "@/components/flashcard-viewer"
import { TextToSpeechPlayer } from "@/components/text-to-speech-player"
import { AudioTest } from "@/components/audio-test"
import { MobileMemoNav } from "@/components/mobile-memo-nav"
import { ScoreChart } from "@/components/score-chart"
import { SRToggle } from "@/components/sr-toggle"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

type PageMode = "view" | "familiarize" | "flashcards" | "chunk-select" | "practice" | "test-select" | "first-letter-test" | "typing-test" | "audio-test" | "encode-method-select" | "sorting-game"

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return "Today"
  if (diffDays === 1) return "Yesterday"
  if (diffDays < 7) return `${diffDays} days ago`
  
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  })
}

function getChunkLabel(mode: ChunkMode, count: number): string {
  const plural = count !== 1 ? "s" : ""
  switch (mode) {
    case "line":
      return `line${plural}`
    case "paragraph":
      return `paragraph${plural}`
    case "sentence":
      return `sentence${plural}`
    case "custom":
      return `chunk${plural}`
    default:
      return `chunk${plural}`
  }
}

interface MemorizationDetailPageProps {
  params: Promise<{ id: string }>
}

export default function MemorizationDetailPage({ params }: MemorizationDetailPageProps) {
  const { id } = use(params)
  // useSetList for reactive data (re-renders when this set's progress updates)
  const { isLoaded, sets } = useSetList()
  // useSetActions for stable mutation callbacks (never change identity)
  const { updateChunkMode, markFamiliarizeComplete, updateEncodeProgress, updateTestScore, updateSessionState, updateReviewedChunks, updateMarkedChunks, getAudioUrl, updateRepetitionMode } = useSetActions()
  const set = sets.find((s) => s.id === id)
  const [pageMode, setPageMode] = useState<PageMode>("view")
  const [practiceChunkIndex, setPracticeChunkIndex] = useState<number | null>(null)
  const [selectedPracticeChunkIndexes, setSelectedPracticeChunkIndexes] = useState<number[]>([])
  const [practiceQueuePosition, setPracticeQueuePosition] = useState(0)
  const [familiarizeSubView, setFamiliarizeSubView] = useState<"landing" | "reader">("landing")
  const [familiarizeView, setFamiliarizeView] = useState<"full" | "chunks">("full")
  const [contentExpanded, setContentExpanded] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [showTTSPlayer, setShowTTSPlayer] = useState(false)
  const [showListenOptions, setShowListenOptions] = useState(false)
  const [showMarkedOnly, setShowMarkedOnly] = useState(false)
  const [showSystemInfo, setShowSystemInfo] = useState(false)
  const [showSharePanel, setShowSharePanel] = useState(false)
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [shareLoading, setShareLoading] = useState(false)
  const [shareCopied, setShareCopied] = useState(false)

  // Fetch audio URL via cached context helper (24-hour signed URL)
  useEffect(() => {
    if (set?.audioFilePath) {
      getAudioUrl(id).then(url => setAudioUrl(url))
    }
  }, [set?.id, set?.audioFilePath]) // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Stable callbacks (defined before early returns so useCallback is unconditional) ───

  const handleOpenTTSPlayer = useCallback(() => setShowTTSPlayer(true), [])
  const handleCloseTTSPlayer = useCallback(() => setShowTTSPlayer(false), [])

  const handleShare = useCallback(async () => {
    if (!set) return
    if (set.shareToken) {
      setShareUrl(`${window.location.origin}/share/${set.shareToken}`)
      setShowSharePanel(true)
      return
    }
    setShareLoading(true)
    try {
      const res = await fetch('/api/share/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ setId: set.id }),
      })
      const data = await res.json()
      if (res.ok) {
        setShareUrl(data.url)
        setShowSharePanel(true)
      } else {
        toast.error(data.error || 'Failed to generate share link')
      }
    } catch {
      toast.error('Failed to generate share link')
    } finally {
      setShareLoading(false)
    }
  }, [set])

  const handleCopyShareUrl = useCallback(() => {
    if (!shareUrl) return
    navigator.clipboard.writeText(shareUrl)
    setShareCopied(true)
    setTimeout(() => setShareCopied(false), 2000)
    toast.success('Link copied!')
  }, [shareUrl])

  const handleRevokeShare = useCallback(async () => {
    if (!set) return
    try {
      await fetch('/api/share/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ setId: set.id }),
      })
      setShareUrl(null)
      setShowSharePanel(false)
      toast.success('Share link disabled')
    } catch {
      toast.error('Failed to disable share link')
    }
  }, [set])
  const handleChunkModeChange = useCallback((mode: ChunkMode) => {
    updateChunkMode(id, mode)
  }, [id, updateChunkMode])

  // Encode navigation
  const startPracticeQueue = useCallback((indexes: number[]) => {
    const normalizedIndexes = Array.from(new Set(indexes)).sort((a, b) => a - b)
    if (normalizedIndexes.length === 0) return

    const firstIndex = normalizedIndexes[0]
    setSelectedPracticeChunkIndexes(normalizedIndexes)
    setPracticeQueuePosition(0)
    setPracticeChunkIndex(firstIndex)
    setPageMode("practice")
    updateSessionState(id, { currentStep: "encode", currentChunkIndex: firstIndex })
    trackEvent(ENCODE_STARTED, { set_id: id, chunk_indices: normalizedIndexes, chunk_count: normalizedIndexes.length })
  }, [id, updateSessionState])

  const startPractice = useCallback((index: number) => {
    startPracticeQueue([index])
  }, [startPracticeQueue])

  const exitPractice = useCallback(() => {
    setPracticeChunkIndex(null)
    setPracticeQueuePosition(0)
    setPageMode("chunk-select")
  }, [])

  const finishEncoding = useCallback(() => {
    setPracticeChunkIndex(null)
    setPracticeQueuePosition(0)
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

  const exitFamiliarize = useCallback(() => {
    setPageMode("view")
    updateSessionState(id, { currentStep: null })
  }, [id, updateSessionState])

  const continueToEncode = useCallback(() => {
    markFamiliarizeComplete(id)
    toast.success("Progress saved")
    setPageMode("chunk-select")
  }, [id, markFamiliarizeComplete])

  // Flashcard navigation
  const handleFlashcards = useCallback(() => {
    setPageMode("flashcards")
    setShowMarkedOnly(false)
    updateSessionState(id, { currentStep: "familiarize", currentChunkIndex: 0 })
  }, [id, updateSessionState])

  const exitFlashcards = useCallback(() => {
    setPageMode("familiarize")
    setShowMarkedOnly(false)
    updateSessionState(id, { currentChunkIndex: null })
  }, [id, updateSessionState])

  const continueFromFlashcards = useCallback(() => {
    markFamiliarizeComplete(id)
    toast.success("Progress saved")
    setPageMode("chunk-select")
  }, [id, markFamiliarizeComplete])

  // Encode method select navigation
  const handleEncode = useCallback(() => {
    setPageMode("encode-method-select")
    updateSessionState(id, { currentStep: "encode", currentChunkIndex: null, currentEncodeStage: null })
  }, [id, updateSessionState])

  const exitEncodeMethodSelect = useCallback(() => setPageMode("view"), [])

  const startFirstLetterMethod = useCallback(() => {
    setPageMode("chunk-select")
    trackEvent(ENCODE_METHOD_SELECTED, { set_id: id, method: 'first_letter', chunk_count: set?.chunks.length ?? 0 })
  }, [id, set?.chunks.length])

  const startSortingGame = useCallback(() => {
    setPageMode("sorting-game")
    trackEvent(ENCODE_METHOD_SELECTED, { set_id: id, method: 'sorting', chunk_count: set?.chunks.length ?? 0 })
  }, [id, set?.chunks.length])

  const exitSortingGame = useCallback(() => setPageMode("encode-method-select"), [])

  const finishSortingGame = useCallback(() => {
    setPageMode("view")
    updateSessionState(id, { currentStep: null })
  }, [id, updateSessionState])

  // Encode chunk-select navigation
  const exitChunkSelect = useCallback(() => setPageMode("encode-method-select"), [])

  // Test navigation
  const handleTest = useCallback(() => {
    setPageMode("test-select")
    updateSessionState(id, { currentStep: "test", currentChunkIndex: null, currentEncodeStage: null })
  }, [id, updateSessionState])

  const exitTestSelect = useCallback(() => setPageMode("view"), [])

  const startFirstLetterTest = useCallback(() => {
    setPageMode("first-letter-test")
    updateSessionState(id, { currentStep: "test" })
    trackEvent(TEST_STARTED, { set_id: id, test_type: 'first_letter' })
  }, [id, updateSessionState])

  const exitFirstLetterTest = useCallback(() => setPageMode("test-select"), [])

  const finishTesting = useCallback(() => {
    setPageMode("view")
    updateSessionState(id, { currentStep: null })
  }, [id, updateSessionState])

  const startTypingTest = useCallback(() => {
    setPageMode("typing-test")
    updateSessionState(id, { currentStep: "test" })
    trackEvent(TEST_STARTED, { set_id: id, test_type: 'full_text' })
  }, [id, updateSessionState])

  const exitTypingTest = useCallback(() => setPageMode("test-select"), [])

  const startAudioTest = useCallback(() => {
    setPageMode("audio-test")
    updateSessionState(id, { currentStep: "test" })
    trackEvent(TEST_STARTED, { set_id: id, test_type: 'audio' })
  }, [id, updateSessionState])

  const exitAudioTest = useCallback(() => setPageMode("test-select"), [])

  if (!isLoaded) {
    return (
      <div className="flex min-h-svh flex-col">
        <Header title="" showBack />
        <main className="flex flex-1 flex-col items-center justify-center gap-3">
          <Spinner size="lg" />
          <p className="text-sm text-muted-foreground">Loading memorization...</p>
        </main>
      </div>
    )
  }

  if (!set) {
    return (
      <div className="flex min-h-svh flex-col">
        <Header title="" showBack />
        <main className="flex flex-1 flex-col items-center justify-center p-4">
          <Empty className="max-w-sm border-0">
            <EmptyHeader>
              <EmptyMedia variant="icon" className="size-14 rounded-full bg-muted text-muted-foreground [&_svg]:size-6">
                <AlertCircle />
              </EmptyMedia>
              <EmptyTitle>Memorization not found</EmptyTitle>
              <EmptyDescription>
                This memorization set may have been deleted or the link is incorrect.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button asChild size="lg" className="w-full">
                <Link href="/">Back to Library</Link>
              </Button>
            </EmptyContent>
          </Empty>
        </main>
      </div>
    )
  }

  const chunks = set.chunks
  const wordCount = countWords(set.content)
  const hasContent = chunks.length > 0 && wordCount > 0
  const selectedPracticeCount = selectedPracticeChunkIndexes.length
  const selectedPracticeWordCount = selectedPracticeChunkIndexes.reduce((total, index) => {
    const chunk = chunks[index]
    return total + (chunk ? countWords(chunk.text) : 0)
  }, 0)

  // Helper functions for progress hub
  type StepStatus = "not-started" | "in-progress" | "complete"

  const getFamiliarizeStatus = (): StepStatus => {
    return set.progress.familiarizeCompleted ? "complete" : "not-started"
  }

  const getEncodeStatus = (): StepStatus => {
    const { stage1Completed, stage2Completed, stage3Completed } = set.progress.encode
    if (stage1Completed && stage2Completed && stage3Completed) return "complete"
    if (stage1Completed || stage2Completed || stage3Completed) return "in-progress"
    return "not-started"
  }

  const getEncodeProgress = (): string => {
    const { stage1Completed, stage2Completed, stage3Completed } = set.progress.encode
    const completed = [stage1Completed, stage2Completed, stage3Completed].filter(Boolean).length
    return `${completed}/3 levels`
  }

  const getTestStatus = (): StepStatus => {
    const { firstLetter, fullText, audioTest } = set.progress.tests
    const hasFirstLetter = firstLetter.lastScore !== null
    const hasFullText = fullText.lastScore !== null
    const hasAudioTest = audioTest.lastScore !== null
    
    // Test section complete when ANY test is taken (changed from requiring all 3)
    if (hasFirstLetter || hasFullText || hasAudioTest) return "complete"
    return "not-started"
  }

  const getTestProgress = (): string => {
    const { firstLetter, fullText, audioTest } = set.progress.tests
    const completed = [firstLetter.lastScore !== null, fullText.lastScore !== null, audioTest.lastScore !== null].filter(Boolean).length
    return `${completed}/3 tests`
  }

  /**
   * Calculates overall completion percentage.
   * Each step contributes 33.33% to the total:
   * - Familiarize: 33.33% (complete when familiarizeCompleted = true)
   * - Encode: 33.33% (complete when all 3 stages done)
   * - Test: 33.33% (complete when any 1 test taken)
   */
  const getOverallCompletion = (): number => {
    let completed = 0
    let total = 3

    if (set.progress.familiarizeCompleted) completed++
    if (set.progress.encode.stage1Completed && set.progress.encode.stage2Completed && set.progress.encode.stage3Completed) completed++
    
    const { firstLetter, fullText, audioTest } = set.progress.tests
    if (firstLetter.lastScore !== null || fullText.lastScore !== null || audioTest.lastScore !== null) completed++

    return Math.round((completed / total) * 100)
  }

  const getLastPracticedDate = (): string | null => {
    return set.sessionState.lastVisitedAt
  }

  const getHighestTestScore = (): number => {
    const scores = [
      set.progress.tests.firstLetter.bestScore,
      set.progress.tests.fullText.bestScore,
      set.progress.tests.audioTest.bestScore,
    ].filter((score): score is number => score !== null)

    return scores.length > 0 ? Math.max(...scores) : 0
  }

  const getStatusBadge = (status: StepStatus) => {
    switch (status) {
      case "complete":
        return (
          <Badge variant="default" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20">
            Complete
          </Badge>
        )
      case "in-progress":
        return (
          <Badge variant="default" className="bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20">
            In Progress
          </Badge>
        )
      case "not-started":
        return null
    }
  }

  const hasResumePoint = (): boolean => {
    const { currentStep, lastVisitedAt } = set.sessionState
    return currentStep !== null && lastVisitedAt !== null
  }

  const handleResume = () => {
    const { currentStep, currentChunkIndex, currentEncodeStage } = set.sessionState

    if (!currentStep) {
      // Fallback to recommended path
      handleRecommendedPath()
      return
    }

    switch (currentStep) {
      case "familiarize":
        setPageMode("familiarize")
        break
      
      case "encode":
        if (currentChunkIndex !== null) {
          // Resume specific chunk
          setPracticeChunkIndex(currentChunkIndex)
          setPageMode("practice")
        } else {
          // Go to method selection
          setPageMode("encode-method-select")
        }
        break
      
      case "test":
        setPageMode("test-select")
        break
      
      default:
        setPageMode("view")
    }
  }

  const handleRecommendedPath = () => {
    switch (set.recommendedStep) {
      case "familiarize":
        handleFamiliarize()
        break
      case "encode":
        handleEncode()
        break
      case "test":
        handleTest()
        break
    }
  }

  const getProgressModuleCTA = (): { label: string; description: string; onClick: () => void } => {
    if (hasResumePoint()) {
      switch (set.sessionState.currentStep) {
        case "encode":
          return {
            label: "Resume Training",
            description: "Continue where you left off and keep building recall.",
            onClick: handleResume,
          }
        case "familiarize":
          return {
            label: "Continue Familiarizing",
            description: "Pick up reading practice where you left off.",
            onClick: handleResume,
          }
        case "test":
          return {
            label: "Resume Testing",
            description: "Jump back into your last test flow.",
            onClick: handleResume,
          }
      }
    }

    switch (set.recommendedStep) {
      case "familiarize":
        return {
          label: "Start Familiarizing",
          description: "Build a strong first pass before training recall.",
          onClick: handleFamiliarize,
        }
      case "encode":
        return {
          label: "Start Training",
          description: "Begin encoding to strengthen recall accuracy.",
          onClick: handleEncode,
        }
      case "test":
      default:
        return {
          label: "Take a Test",
          description: "Complete your first test to see your progress over time.",
          onClick: handleTest,
        }
    }
  }

  const progressModuleCTA = getProgressModuleCTA()
  const highestTestScore = getHighestTestScore()

  // Familiarize mode
  if (pageMode === "familiarize") {
    // Reader sub-view: shows content with view toggle and chunk selector
    if (familiarizeSubView === "reader" && hasContent) {
      return (
        <SessionLayout
          step="Step 1"
          title="Familiarize"
          setTitle={set.title}
          onBack={exitFamiliarize}
          primaryAction={{
            label: "Continue to Training",
            onClick: continueToEncode,
            icon: <ArrowRight className="size-4" />,
          }}
          secondaryAction={{
            label: "Back to Overview",
            onClick: () => setFamiliarizeSubView("landing"),
          }}
        >
          {/* View Toggle */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-center">
              <ButtonGroup>
                <Button
                  variant={familiarizeView === "full" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFamiliarizeView("full")}
                >
                  Full Text
                </Button>
                <Button
                  variant={familiarizeView === "chunks" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFamiliarizeView("chunks")}
                >
                  By Chunk
                </Button>
              </ButtonGroup>
            </div>

            {/* Chunk Mode Selector as dropdown — only in chunk view */}
            {familiarizeView === "chunks" && (
              <div className="flex items-center justify-between gap-3 rounded-lg bg-muted/40 px-3 py-2">
                <span className="text-sm text-muted-foreground">Split by</span>
                <Select
                  value={set.chunkMode}
                  onValueChange={(v) => updateChunkMode(id, v as ChunkMode)}
                >
                  <SelectTrigger className="h-8 w-auto min-w-[130px] border-0 bg-transparent text-sm font-medium focus:ring-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="line">Line</SelectItem>
                    <SelectItem value="paragraph">Paragraph</SelectItem>
                    <SelectItem value="sentence">Sentence</SelectItem>
                    <SelectItem value="custom">Custom (/)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
              <span>{wordCount} words</span>
              <span className="size-1 rounded-full bg-muted-foreground/30" />
              <span>{chunks.length} {getChunkLabel(set.chunkMode, chunks.length)}</span>
            </div>
          </div>

          {/* Content Display */}
          {familiarizeView === "full" ? (
            <Card>
              <CardContent className="py-5">
                <div className={contentExpanded ? "" : "max-h-[300px] overflow-hidden relative"}>
                  <p className="whitespace-pre-wrap text-base leading-7 text-foreground">
                    {set.content}
                  </p>
                  {!contentExpanded && set.content.length > 500 && (
                    <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-card to-transparent" />
                  )}
                </div>
                {set.content.length > 500 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setContentExpanded(!contentExpanded)}
                    className="w-full mt-3 gap-2"
                  >
                    {contentExpanded ? (
                      <>
                        <ChevronUp className="size-4" />
                        Show Less
                      </>
                    ) : (
                      <>
                        <ChevronDown className="size-4" />
                        See More
                      </>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col gap-3">
              {(contentExpanded ? chunks : chunks.slice(0, 3)).map((chunk) => (
                <Card key={chunk.id}>
                  <CardContent className="flex gap-4 py-4">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                      {chunk.orderIndex + 1}
                    </span>
                    <p className="flex-1 text-base leading-7 text-foreground">{chunk.text}</p>
                  </CardContent>
                </Card>
              ))}
              {chunks.length > 3 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setContentExpanded(!contentExpanded)}
                  className="w-full gap-2"
                >
                  {contentExpanded ? (
                    <>
                      <ChevronUp className="size-4" />
                      Show Less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="size-4" />
                      See More ({chunks.length - 3} more chunks)
                    </>
                  )}
                </Button>
              )}
            </div>
          )}
        </SessionLayout>
      )
    }

    // Landing sub-view: shows action cards with CTAs
    return (
      <SessionLayout
        step="Step 1"
        title="Familiarize"
        setTitle={set.title}
        onBack={exitFamiliarize}
        contextAction={
          <Select value={set.chunkMode} onValueChange={(v) => updateChunkMode(id, v as ChunkMode)}>
            <SelectTrigger className="h-7 w-auto gap-1 border-0 bg-transparent px-2 text-xs font-medium focus:ring-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="line">Line</SelectItem>
              <SelectItem value="paragraph">Paragraph</SelectItem>
              <SelectItem value="sentence">Sentence</SelectItem>
              <SelectItem value="custom">Custom (/)</SelectItem>
            </SelectContent>
          </Select>
        }
        primaryAction={hasContent ? {
          label: "Continue to Training",
          onClick: continueToEncode,
          icon: <ArrowRight className="size-4" />,
        } : undefined}
        secondaryAction={{
          label: "Back to Detail",
          onClick: exitFamiliarize,
        }}
      >
        {!hasContent ? (
          <Empty className="flex-1 border-0">
            <EmptyHeader>
              <EmptyMedia variant="icon" className="size-12 rounded-full bg-muted text-muted-foreground [&_svg]:size-5">
                <FileText />
              </EmptyMedia>
              <EmptyTitle>No content to display</EmptyTitle>
              <EmptyDescription>
                This memorization set appears to be empty. Try editing the content or creating a new set.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <>
            {/* Read and Absorb CTA */}
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="flex gap-4 py-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <BookOpen className="size-5 text-primary" />
                </div>
                <div className="flex flex-1 flex-col gap-2">
                  <div className="flex flex-col gap-1">
                    <h3 className="font-medium text-foreground">Read and Absorb</h3>
                    <p className="text-sm text-muted-foreground">
                      Take your time reading through the content. Focus on understanding the flow, key phrases, and structure.
                    </p>
                  </div>
                  <Button
                    onClick={() => { setContentExpanded(false); setFamiliarizeSubView("reader") }}
                    size="sm"
                    className="w-full sm:w-auto"
                  >
                    <BookOpen className="size-4 mr-2" />
                    Start Reading
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Flashcard Mode CTA */}
            <Card className="border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5">
              <CardContent className="flex gap-4 py-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/15">
                  <BookMarked className="size-5 text-primary" />
                </div>
                <div className="flex flex-1 flex-col gap-2">
                  <div className="flex flex-col gap-1">
                    <h3 className="font-medium text-foreground">Flashcard Mode</h3>
                    <p className="text-sm text-muted-foreground">
                      Review chunks one at a time with swipe navigation. Track progress and mark chunks for later review.
                      {(set.progress.markedChunks?.length ?? 0) > 0 && ` ${set.progress.markedChunks.length} marked for review.`}
                    </p>
                  </div>
                  <Button onClick={handleFlashcards} className="w-full sm:w-auto" size="sm">
                    Start Flashcards
                    <ArrowRight className="size-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Listen Section — combined when recording exists, TTS-only when not */}
            {audioUrl ? (
              showTTSPlayer ? (
                <TextToSpeechPlayer
                  content={set.content}
                  onClose={handleCloseTTSPlayer}
                />
              ) : (
                <Card className="border-purple-500/20 bg-purple-500/5">
                  <CardContent className="flex flex-col gap-3 py-4">
                    {!showListenOptions ? (
                      <div className="flex gap-4">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-purple-500/10">
                          <Headphones className="size-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div className="flex flex-1 flex-col gap-2">
                          <div className="flex flex-col gap-1">
                            <h3 className="font-medium text-foreground">Listen</h3>
                            <p className="text-sm text-muted-foreground">
                              Play your recording or have AI read the content aloud to you.
                            </p>
                          </div>
                          <Button
                            onClick={() => setShowListenOptions(true)}
                            className="w-full sm:w-auto"
                            size="sm"
                          >
                            <Headphones className="size-4 mr-2" />
                            Listen
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-medium text-foreground">Choose how to listen</h3>
                          <button
                            onClick={() => setShowListenOptions(false)}
                            className="text-xs text-muted-foreground hover:text-foreground"
                          >
                            <X className="size-4" />
                          </button>
                        </div>
                        <div className="flex flex-col gap-2">
                          <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3">
                            <div className="mb-2 flex items-center gap-2">
                              <Headphones className="size-4 text-blue-600 dark:text-blue-400" />
                              <span className="text-sm font-medium">Your Recording</span>
                            </div>
                            <TimedAudioPlayer
                              audioUrl={audioUrl}
                              transcript={set.transcript}
                              transcriptWords={set.transcriptWords}
                            />
                          </div>
                          <button
                            onClick={handleOpenTTSPlayer}
                            className="flex items-center gap-3 rounded-lg border border-purple-500/20 bg-purple-500/5 p-3 text-left hover:bg-purple-500/10 transition-colors"
                          >
                            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-purple-500/10">
                              <Volume2 className="size-4 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">AI Read Aloud</p>
                              <p className="text-xs text-muted-foreground">Natural AI voice reads the content aloud</p>
                            </div>
                          </button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            ) : showTTSPlayer ? (
              <TextToSpeechPlayer
                content={set.content}
                onClose={handleCloseTTSPlayer}
              />
            ) : (
              <Card className="border-purple-500/20 bg-purple-500/5">
                <CardContent className="flex gap-4 py-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-purple-500/10">
                    <Volume2 className="size-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="flex flex-1 flex-col gap-2">
                    <div className="flex flex-col gap-1">
                      <h3 className="font-medium text-foreground">AI Read Aloud</h3>
                      <p className="text-sm text-muted-foreground">
                        Natural AI voice reads the content aloud. Great for auditory learners.
                      </p>
                    </div>
                    <Button
                      onClick={handleOpenTTSPlayer}
                      className="w-full sm:w-auto"
                      size="sm"
                    >
                      <Volume2 className="size-4 mr-2" />
                      Read Aloud
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

          </>
        )}
      </SessionLayout>
    )
  }

  // Flashcard mode
  if (pageMode === "flashcards") {
    const markedChunkIds = set.progress.markedChunks ?? []
    const filteredChunks = showMarkedOnly 
      ? chunks.filter(chunk => markedChunkIds.includes(chunk.id))
      : chunks
    const hasMarkedChunks = markedChunkIds.length > 0
    const showingMarkedEmpty = showMarkedOnly && filteredChunks.length === 0

    return (
      <SessionLayout
        step="Step 1"
        title="Flashcards"
        setTitle={set.title}
        onBack={exitFlashcards}
        primaryAction={hasContent ? {
          label: "Continue to Training",
          onClick: continueFromFlashcards,
          icon: <ArrowRight className="size-4" />,
        } : undefined}
        secondaryAction={{
          label: "Back to Reading",
          onClick: exitFlashcards,
        }}
      >
        {!hasContent ? (
          <Empty className="flex-1 border-0">
            <EmptyHeader>
              <EmptyMedia variant="icon" className="size-12 rounded-full bg-muted text-muted-foreground [&_svg]:size-5">
                <FileText />
              </EmptyMedia>
              <EmptyTitle>No content to display</EmptyTitle>
              <EmptyDescription>
                This memorization set appears to be empty. Try editing the content or creating a new set.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="flex flex-col gap-4">
            {/* Filter toggle button */}
            {hasMarkedChunks && (
              <div className="flex justify-center">
                <Button
                  variant={showMarkedOnly ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowMarkedOnly(!showMarkedOnly)}
                  className="gap-2"
                >
                  {showMarkedOnly ? (
                    <>
                      <X className="size-4" />
                      Show All ({chunks.length})
                    </>
                  ) : (
                    <>
                      <Bookmark className="size-4" />
                      Marked {markedChunkIds.length}
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Empty state when viewing marked but none exist */}
            {showingMarkedEmpty ? (
              <Empty className="flex-1 border-0">
                <EmptyHeader>
                  <EmptyMedia variant="icon" className="size-12 rounded-full bg-muted text-muted-foreground [&_svg]:size-5">
                    <Bookmark />
                  </EmptyMedia>
                  <EmptyTitle>No marked chunks</EmptyTitle>
                  <EmptyDescription>
                    Tap the bookmark icon on any flashcard to save it for later review.
                  </EmptyDescription>
                  <EmptyContent>
                    <Button
                      variant="outline"
                      onClick={() => setShowMarkedOnly(false)}
                      className="gap-2"
                    >
                      <ArrowRight className="size-4" />
                      View All Chunks
                    </Button>
                  </EmptyContent>
                </EmptyHeader>
              </Empty>
            ) : (
              <FlashcardViewer
                chunks={filteredChunks}
                initialIndex={0}
                reviewedChunks={set.progress.reviewedChunks ?? []}
                markedChunks={markedChunkIds}
                onUpdateReviewed={(chunkIds) => updateReviewedChunks(id, chunkIds)}
                onUpdateMarked={(chunkIds) => updateMarkedChunks(id, chunkIds)}
              />
            )}
          </div>
        )}
      </SessionLayout>
    )
  }

  // Encode method selection
  if (pageMode === "encode-method-select") {
    return (
      <SessionLayout
        step="Step 2"
        title="Train"
        setTitle={set.title}
        onBack={exitEncodeMethodSelect}
        showBottomActions={false}
        contextAction={
          <Select value={set.chunkMode} onValueChange={(v) => updateChunkMode(id, v as ChunkMode)}>
            <SelectTrigger className="h-7 w-auto gap-1 border-0 bg-transparent px-2 text-xs font-medium focus:ring-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="line">Line</SelectItem>
              <SelectItem value="paragraph">Paragraph</SelectItem>
              <SelectItem value="sentence">Sentence</SelectItem>
              <SelectItem value="custom">Custom (/)</SelectItem>
            </SelectContent>
          </Select>
        }
      >
        <div className="rounded-lg bg-muted/50 p-3">
          <p className="text-sm text-muted-foreground">
            Choose a training method. Both methods help reinforce recall from memory.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {/* First Letter Method */}
          <Card>
            <CardContent className="flex flex-col gap-4 py-5">
              <div className="flex items-start gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <LetterText className="size-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">First Letter</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Progressive first-letter encoding across 3 difficulty levels
                  </p>
                </div>
              </div>
              <div className="rounded-lg bg-muted/30 p-3">
                <p className="text-sm text-muted-foreground">
                  {chunks.length} {getChunkLabel(set.chunkMode, chunks.length)} · select which chunks to practice
                </p>
              </div>
              <Button onClick={startFirstLetterMethod} className="w-full" disabled={!hasContent}>
                Practice
              </Button>
            </CardContent>
          </Card>

          {/* Sorting Game */}
          <Card>
            <CardContent className="flex flex-col gap-4 py-5">
              <div className="flex items-start gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <Layers className="size-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Sorting Game</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Rearrange shuffled chunks back into the correct order
                  </p>
                </div>
              </div>
              <div className="rounded-lg bg-muted/30 p-3">
                <p className="text-sm text-muted-foreground">
                  {chunks.length} {getChunkLabel(set.chunkMode, chunks.length)} · drag-and-drop or arrows
                </p>
              </div>
              <Button onClick={startSortingGame} className="w-full" disabled={!hasContent || chunks.length < 2}>
                {chunks.length < 2 ? 'Need at least 2 chunks' : 'Start Game'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </SessionLayout>
    )
  }

  // Sorting game
  if (pageMode === "sorting-game") {
    return (
      <SortingGame
        setId={id}
        chunks={chunks}
        chunkMode={set.chunkMode}
        onChunkModeChange={(mode) => updateChunkMode(id, mode)}
        onBack={exitSortingGame}
        onFinish={finishSortingGame}
      />
    )
  }

  // Chunk selection mode (First Letter method)
  if (pageMode === "chunk-select") {
    return (
      <SessionLayout
        step="Step 2"
        title="First Letter"
        setTitle={set.title}
        onBack={exitChunkSelect}
        contextAction={
          <Select value={set.chunkMode} onValueChange={(v) => updateChunkMode(id, v as ChunkMode)}>
            <SelectTrigger className="h-7 w-auto gap-1 border-0 bg-transparent px-2 text-xs font-medium focus:ring-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="line">Line</SelectItem>
              <SelectItem value="paragraph">Paragraph</SelectItem>
              <SelectItem value="sentence">Sentence</SelectItem>
              <SelectItem value="custom">Custom (/)</SelectItem>
            </SelectContent>
          </Select>
        }
        primaryAction={hasContent ? {
          label: selectedPracticeCount > 0
            ? `Start Practice · ${selectedPracticeCount} ${getChunkLabel(set.chunkMode, selectedPracticeCount)}`
            : "Select chunks to practice",
          onClick: () => startPracticeQueue(selectedPracticeChunkIndexes),
          disabled: selectedPracticeCount === 0,
        } : undefined}
        secondaryAction={hasContent ? {
          label: "Skip to Test",
          onClick: continueFromEncodeToTest,
          variant: "outline",
        } : {
          label: "Back to Detail",
          onClick: exitChunkSelect,
        }}
      >
        {!hasContent ? (
          <Empty className="flex-1 border-0">
            <EmptyHeader>
              <EmptyMedia variant="icon" className="size-12 rounded-full bg-muted text-muted-foreground [&_svg]:size-5">
                <FileText />
              </EmptyMedia>
              <EmptyTitle>No content to encode</EmptyTitle>
              <EmptyDescription>
                This memorization set appears to be empty. Add content to start practicing.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <>
            {/* Instructions */}
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-sm text-muted-foreground">
                Select one or more chunks to practice. Verbatim will queue them in order and move you through the selected set.
              </p>
            </div>

            <div className="flex items-center justify-between gap-3 rounded-lg border bg-card px-3 py-2">
              <div className="flex flex-col">
                <span className="text-sm font-medium">{selectedPracticeCount} selected</span>
                <span className="text-xs text-muted-foreground">
                  {selectedPracticeCount > 0
                    ? `${selectedPracticeWordCount} words queued`
                    : "Tap chunks below to build a practice queue"}
                </span>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={selectAllPracticeChunks} className="gap-2 shadow-sm">
                  <CheckCircle2 className="size-4" />
                  Select All Chunks
                </Button>
                {selectedPracticeCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearPracticeChunkSelection}>
                    Clear
                  </Button>
                )}
              </div>
            </div>

            {/* Chunk List */}
            <div className="flex flex-col gap-3">
              {chunks.map((chunk) => (
                <button
                  key={chunk.id}
                  onClick={() => togglePracticeChunkSelection(chunk.orderIndex)}
                  className={`flex gap-3 rounded-lg border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    selectedPracticeChunkIndexes.includes(chunk.orderIndex)
                      ? "border-primary bg-primary/5"
                      : "bg-card hover:bg-accent/50"
                  }`}
                >
                  <span className={`flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-medium ${
                    selectedPracticeChunkIndexes.includes(chunk.orderIndex)
                      ? "bg-primary text-primary-foreground"
                      : "bg-primary/10 text-primary"
                  }`}>
                    {selectedPracticeChunkIndexes.includes(chunk.orderIndex) ? <CheckCircle2 className="size-4" /> : chunk.orderIndex + 1}
                  </span>
                  <div className="flex flex-1 flex-col gap-2">
                    <p className="text-sm leading-relaxed line-clamp-3">{chunk.text}</p>
                    <p className="text-xs text-muted-foreground">
                      Chunk {chunk.orderIndex + 1} · {countWords(chunk.text)} word{countWords(chunk.text) !== 1 ? "s" : ""}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </SessionLayout>
    )
  }

  // Test selection mode
  if (pageMode === "test-select") {
    return (
      <SessionLayout
        step="Step 3"
        title="Test"
        setTitle={set.title}
        onBack={exitTestSelect}
        showBottomActions={false}
        contextAction={
          <Select value={set.chunkMode} onValueChange={(v) => updateChunkMode(id, v as ChunkMode)}>
            <SelectTrigger className="h-7 w-auto gap-1 border-0 bg-transparent px-2 text-xs font-medium focus:ring-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="line">Line</SelectItem>
              <SelectItem value="paragraph">Paragraph</SelectItem>
              <SelectItem value="sentence">Sentence</SelectItem>
              <SelectItem value="custom">Custom (/)</SelectItem>
            </SelectContent>
          </Select>
        }
      >
        {/* Instructions */}
        <div className="rounded-lg bg-muted/50 p-3">
          <p className="text-sm text-muted-foreground">
            Select a test method. All three methods can help validate complete recall from memory.
          </p>
        </div>

        {/* Test Options */}
        <div className="flex flex-col gap-4">
          {/* First Letter Test Option */}
          <Card>
            <CardContent className="flex flex-col gap-4 py-5">
              <div className="flex items-start gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <LetterText className="size-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">First Letter Recall</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Type first letters to reveal each word
                  </p>
                </div>
              </div>
              <div className="rounded-lg bg-muted/30 p-3">
                <p className="text-sm text-muted-foreground">
                  {wordCount} words · {chunks.length} {getChunkLabel(set.chunkMode, chunks.length)}
                </p>
              </div>
              <Button onClick={startFirstLetterTest} className="w-full">
                Begin Test
              </Button>
            </CardContent>
          </Card>

          {/* Full Passage Test Option */}
          <Card>
            <CardContent className="flex flex-col gap-4 py-5">
              <div className="flex items-start gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <Keyboard className="size-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Full Recall</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Type the complete passage from memory
                  </p>
                </div>
              </div>
              <div className="rounded-lg bg-muted/30 p-3">
                <p className="text-sm text-muted-foreground">
                  {wordCount} words · {chunks.length} {getChunkLabel(set.chunkMode, chunks.length)}
                </p>
              </div>
              <Button onClick={startTypingTest} className="w-full">
                Begin Test
              </Button>
            </CardContent>
          </Card>

          {/* Audio Test Option */}
          <Card>
            <CardContent className="flex flex-col gap-4 py-5">
              <div className="flex items-start gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <Mic className="size-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Audio Recall</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Record yourself reciting from memory
                  </p>
                </div>
              </div>
              <div className="rounded-lg bg-muted/30 p-3">
                <p className="text-sm text-muted-foreground">
                  Test entire memo or specific chunks · Auto-transcribed
                </p>
              </div>
              <Button onClick={startAudioTest} className="w-full">
                Begin Test
              </Button>
            </CardContent>
          </Card>
        </div>
      </SessionLayout>
    )
  }

  // First letter test mode - tests entire content on one screen
  if (pageMode === "first-letter-test") {
    return (
      <SessionLayout
        step="Step 3"
        title="First Letter Recall Test"
        setTitle={set.title}
        onBack={exitFirstLetterTest}
        showBottomActions={false}
      >
        <FullFirstLetterTest 
          setId={id}
          content={set.content}
          onBack={finishTesting}
        />
      </SessionLayout>
    )
  }

  // Typing test mode
  if (pageMode === "typing-test") {
    return (
      <SessionLayout
        step="Step 3"
        title="Full Recall Test"
        setTitle={set.title}
        onBack={exitTypingTest}
        showBottomActions={false}
      >
        <TypingTest setId={id} content={set.content} onBack={finishTesting} />
      </SessionLayout>
    )
  }

  // Audio test mode
  if (pageMode === "audio-test") {
    return (
      <SessionLayout
        step="Step 3"
        title="Audio Recall Test"
        setTitle={set.title}
        onBack={exitAudioTest}
        showBottomActions={false}
      >
        <AudioTest 
          setId={id} 
          content={set.content} 
          chunks={chunks}
          chunkMode={set.chunkMode}
          onBack={finishTesting} 
        />
      </SessionLayout>
    )
  }

  // Practice mode
  if (pageMode === "practice" && practiceChunkIndex !== null) {
    // Handle entire selection mode
    if (practiceChunkIndex === -1) {
      return (
        <SessionLayout
          step="Step 2"
          title="Encode · Entire Selection"
          setTitle={set.title}
          onBack={exitPractice}
          showBottomActions={false}
        >
          <ProgressiveChunkEncoder
            setId={id}
            chunkId={null}
            chunk={set.content}
            chunkIndex={0}
            totalChunks={1}
            onRetryChunk={handleRetryEntireSelection}
            onContinueToTest={continueFromEncodeToTest}
            onBackToDetail={finishEncoding}
            hasNextChunk={false}
          />
        </SessionLayout>
      )
    }

    const currentChunk = chunks[practiceChunkIndex]

    // Guard against invalid chunk index
    if (!currentChunk) {
      return (
        <SessionLayout
          step="Step 2"
          title="Train Your Recall"
          setTitle={set.title}
          onBack={exitPractice}
          showBottomActions={false}
        >
          <Empty className="flex-1 border-0">
            <EmptyHeader>
              <EmptyMedia variant="icon" className="size-12 rounded-full bg-muted text-muted-foreground [&_svg]:size-5">
                <AlertCircle />
              </EmptyMedia>
              <EmptyTitle>Chunk not found</EmptyTitle>
              <EmptyDescription>
                This chunk could not be loaded. Please try selecting a different chunk.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button onClick={exitPractice} className="w-full">
                Back to Chunks
              </Button>
            </EmptyContent>
          </Empty>
        </SessionLayout>
      )
    }

    const queuedTotal = selectedPracticeChunkIndexes.length > 0 ? selectedPracticeChunkIndexes.length : chunks.length
    const queuePosition = selectedPracticeChunkIndexes.length > 0
      ? practiceQueuePosition
      : practiceChunkIndex
    const hasNextChunk = selectedPracticeChunkIndexes.length > 0
      ? practiceQueuePosition < selectedPracticeChunkIndexes.length - 1
      : practiceChunkIndex < chunks.length - 1
    
    return (
      <SessionLayout
        step="Step 2"
        title={`Encode · Chunk ${queuePosition + 1}/${queuedTotal}`}
        setTitle={set.title}
        onBack={exitPractice}
        showBottomActions={false}
      >
        <ProgressiveChunkEncoder 
          setId={id}
          chunkId={currentChunk.id}
          chunk={currentChunk.text} 
          chunkIndex={queuePosition}
          totalChunks={queuedTotal}
          onRetryChunk={handleRetryChunk}
          onNextChunk={handleNextChunk}
          onContinueToTest={continueFromEncodeToTest}
          onBackToDetail={finishEncoding}
          hasNextChunk={hasNextChunk}
        />
      </SessionLayout>
    )
  }

  // View mode - Progress Hub
  return (
    <div className="flex min-h-svh flex-col">
      <Header 
        title={set.title} 
        showBack 
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setShowSystemInfo(true)}
              aria-label="How the system works"
            >
              <HelpCircle className="size-5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={handleShare}
              disabled={shareLoading}
            >
              {shareLoading ? (
                <><div className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" /><span className="text-sm hidden md:inline">Share</span></>
              ) : (
                <><Share2 className="size-3.5" /><span className="text-sm hidden md:inline">Share</span></>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 hidden md:flex"
              asChild
            >
              <Link href={`/edit/${set.id}`}>
                <Edit3 className="size-3.5" />
                <span className="text-sm">Edit</span>
              </Link>
            </Button>
          </div>
        }
      />
      
      <main className="flex flex-1 flex-col gap-6 p-4 pb-24 md:pb-8">
        {/* Overview Section */}
        <div className="flex flex-col gap-4">
          {/* Completion Progress */}
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
            <CardContent className="flex flex-col gap-4 p-6">
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium text-muted-foreground">Overall Progress</p>
                  <p className="text-3xl font-bold text-primary">{getOverallCompletion()}%</p>
                  <p className="text-xs text-muted-foreground">
                    Memorized (best test): <span className="font-semibold text-foreground">{highestTestScore}%</span>
                  </p>
                </div>
                <div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
                  <Trophy className="size-8 text-primary" />
                </div>
              </div>
              <Progress value={getOverallCompletion()} className="h-2" />
            </CardContent>
          </Card>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-2">
            <div className="flex flex-col items-center gap-1 rounded-lg bg-muted/50 p-3">
              <Type className="size-4 text-muted-foreground" />
              <span className="text-lg font-semibold tabular-nums">{wordCount}</span>
              <span className="text-xs text-muted-foreground">Words</span>
            </div>
            <div className="flex flex-col items-center gap-1 rounded-lg bg-muted/50 p-3">
              <Layers className="size-4 text-muted-foreground" />
              <span className="text-lg font-semibold tabular-nums">{chunks.length}</span>
              <span className="text-xs text-muted-foreground">Chunks</span>
            </div>
            <div className="flex flex-col items-center gap-1 rounded-lg bg-muted/50 p-3">
              <Clock className="size-4 text-muted-foreground" />
              <span className="text-xs font-semibold tabular-nums">
                {getLastPracticedDate() ? formatDate(getLastPracticedDate()!) : "Never"}
              </span>
              <span className="text-xs text-muted-foreground">Last practiced</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Score Charts</h2>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/analytics?set=${id}`}>
              <BarChart3 className="size-3.5" />
              <span>View Full Charts</span>
            </Link>
          </Button>
        </div>

        {/* Progress Over Time */}
        <ScoreChart
          setId={id}
          onStartTest={progressModuleCTA.onClick}
          emptyStateCtaLabel={progressModuleCTA.label}
          emptyStateDescription={progressModuleCTA.description}
        />

        {/* Share Panel */}
        <Dialog open={showSharePanel} onOpenChange={setShowSharePanel}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Share2 className="size-4" />
                Share &ldquo;{set.title}&rdquo;
              </DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4">
              {shareUrl ? (
                <>
                  <p className="text-sm text-muted-foreground">
                    Anyone with this link can preview and import this set.
                  </p>
                  {/* Copy URL */}
                  <div className="flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-2.5">
                    <LinkIcon className="size-3.5 text-muted-foreground shrink-0" />
                    <span className="flex-1 text-xs text-muted-foreground truncate">{shareUrl}</span>
                    <Button variant="ghost" size="icon-sm" onClick={handleCopyShareUrl} className="shrink-0">
                      {shareCopied ? <Check className="size-3.5 text-green-500" /> : <Copy className="size-3.5" />}
                    </Button>
                  </div>
                  {/* Quick share buttons */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-1.5 text-xs"
                      onClick={() => {
                        const msg = `Hey! I'm memorizing "${set.title}" on Verbatim — here's the link to practice it too:\n${shareUrl}`
                        window.open(`sms:?body=${encodeURIComponent(msg)}`)
                      }}
                    >
                      <MessageSquare className="size-3.5" />
                      Text
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-1.5 text-xs"
                      onClick={() => {
                        const subject = `Practice "${set.title}" with me on Verbatim`
                        const body = `I'm memorizing "${set.title}" on Verbatim and thought you'd want to practice it too.\n\nClick here to import it:\n${shareUrl}`
                        window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`)
                      }}
                    >
                      <Mail className="size-3.5" />
                      Email
                    </Button>
                  </div>
                  <button
                    className="text-xs text-destructive hover:underline text-left"
                    onClick={handleRevokeShare}
                  >
                    Stop sharing this set
                  </button>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Generating share link…</p>
              )}
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showSystemInfo} onOpenChange={setShowSystemInfo}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>How the system works</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4 text-sm">
              <div className="flex items-start gap-2.5">
                <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-blue-500/10 mt-0.5">
                  <span className="text-xs font-bold text-blue-600">1</span>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground mb-1">Familiarize</p>
                  <p className="text-muted-foreground">Read through your content multiple times. Use flashcard mode to review chunk-by-chunk.</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-purple-500/10 mt-0.5">
                  <span className="text-xs font-bold text-purple-600">2</span>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground mb-1">Encode with First Letter Method</p>
                  <p className="text-muted-foreground">Train your memory in 3 progressive levels. Start seeing first letters, then gradually less, until you can recall from memory alone.</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-green-500/10 mt-0.5">
                  <span className="text-xs font-bold text-green-600">3</span>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground mb-1">Test Your Recall</p>
                  <p className="text-muted-foreground">Prove your mastery with multiple test modes: first letters only, full typing, or audio recording.</p>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Spaced Repetition */}
        <SRToggle
          mode={set.repetitionMode}
          config={set.repetitionConfig}
          onModeChange={(mode, config) => updateRepetitionMode(id, mode, config)}
        />

        {/* Step Cards */}
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Learning Steps</h2>
          
          {/* Step 1: Familiarize */}
          <Card className={set.recommendedStep === "familiarize" ? "border-primary ring-2 ring-primary/20" : ""}>
            <CardContent className="flex items-start gap-4 p-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-blue-500/10">
                <BookOpen className="size-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex flex-1 flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">Familiarize</h3>
                      {getStatusBadge(getFamiliarizeStatus())}
                    </div>
                    <p className="text-sm text-muted-foreground">Read and absorb the content</p>
                  </div>
                  {getFamiliarizeStatus() === "complete" && (
                    <CheckCircle2 className="size-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {getFamiliarizeStatus() === "not-started" && (
                    <Button onClick={handleFamiliarize} size="sm" className="w-full sm:w-auto">
                      <BookOpen className="size-4 mr-2" />
                      Dive In
                    </Button>
                  )}
                  {getFamiliarizeStatus() === "complete" && (
                    <Button onClick={handleFamiliarize} size="sm" variant="outline" className="w-full sm:w-auto">
                      <BookOpen className="size-4 mr-2" />
                      Review Again
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Step 2: Encode */}
          <Card className={set.recommendedStep === "encode" ? "border-primary ring-2 ring-primary/20" : ""}>
            <CardContent className="flex items-start gap-4 p-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-purple-500/10">
                <Sparkles className="size-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="flex flex-1 flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">Train Your Recall</h3>
                      {getStatusBadge(getEncodeStatus())}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Build memory through 3 progressive levels
                      {getEncodeStatus() === "in-progress" && (
                        <span className="ml-1 font-medium text-amber-600 dark:text-amber-400">· {getEncodeProgress()}</span>
                      )}
                    </p>
                  </div>
                  {getEncodeStatus() === "complete" && (
                    <CheckCircle2 className="size-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  )}
                  {getEncodeStatus() === "in-progress" && (
                    <div className="flex size-5 shrink-0 items-center justify-center">
                      <div className="size-2 rounded-full bg-amber-500 animate-pulse" />
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {getEncodeStatus() === "not-started" && (
                    <Button onClick={handleEncode} size="sm" className="w-full sm:w-auto">
                      <Sparkles className="size-4 mr-2" />
                      Start Training
                    </Button>
                  )}
                  {getEncodeStatus() === "in-progress" && (
                    <Button onClick={handleEncode} size="sm" className="w-full sm:w-auto">
                      <Sparkles className="size-4 mr-2" />
                      Resume Training
                    </Button>
                  )}
                  {getEncodeStatus() === "complete" && (
                    <Button onClick={handleEncode} size="sm" variant="outline" className="w-full sm:w-auto">
                      <Sparkles className="size-4 mr-2" />
                      Practice More
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Step 3: Test */}
          <Card className={set.recommendedStep === "test" ? "border-primary ring-2 ring-primary/20" : ""}>
            <CardContent className="flex items-start gap-4 p-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/10">
                <Target className="size-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="flex flex-1 flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">Test Your Recall</h3>
                      {getStatusBadge(getTestStatus())}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Validate complete recall from memory
                      {getTestStatus() === "in-progress" && (
                        <span className="ml-1 font-medium text-amber-600 dark:text-amber-400">· {getTestProgress()}</span>
                      )}
                    </p>
                  </div>
                  {getTestStatus() === "complete" && (
                    <CheckCircle2 className="size-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  )}
                  {getTestStatus() === "in-progress" && (
                    <div className="flex size-5 shrink-0 items-center justify-center">
                      <div className="size-2 rounded-full bg-amber-500 animate-pulse" />
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {getTestStatus() === "not-started" && (
                    <Button onClick={handleTest} size="sm" className="w-full sm:w-auto">
                      <Target className="size-4 mr-2" />
                      Take the Test
                    </Button>
                  )}
                  {getTestStatus() === "in-progress" && (
                    <Button onClick={handleTest} size="sm" className="w-full sm:w-auto">
                      <Target className="size-4 mr-2" />
                      Finish Testing
                    </Button>
                  )}
                  {getTestStatus() === "complete" && (
                    <Button onClick={handleTest} size="sm" className="w-full sm:w-auto">
                      <Target className="size-4 mr-2" />
                      Test Again
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Metadata */}
        <p className="text-xs text-center text-muted-foreground">
          Created {formatDate(set.createdAt)}
          {set.updatedAt !== set.createdAt && (
            <> · Updated {formatDate(set.updatedAt)}</>
          )}
        </p>
      </main>
      <MobileMemoNav 
        memoId={id}
        onFamiliarize={handleFamiliarize}
        onEncode={handleEncode}
        onTest={handleTest}
        currentStep={null}
      />
    </div>
  )
}
