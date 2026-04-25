"use client"

import { use, useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Header } from "@/components/header"
import { useSetList, useSetActions, countWords, type ChunkMode } from "@/lib/memorization-context"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty"
import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import { Card, CardContent } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { AlertCircle, FileText, Layers, Type, Keyboard, LetterText, BookOpen, ArrowRight, CheckCircle2, Clock, Trophy, Target, Sparkles, BookMarked, Volume2, Headphones, Edit3, Mic, ChevronDown, ChevronUp, Bookmark, X, HelpCircle } from "lucide-react"
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

type PageMode = "view" | "familiarize" | "flashcards" | "chunk-select" | "practice" | "test-select" | "first-letter-test" | "typing-test" | "audio-test"

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
  const [familiarizeSubView, setFamiliarizeSubView] = useState<"landing" | "reader">("landing")
  const [familiarizeView, setFamiliarizeView] = useState<"full" | "chunks">("full")
  const [contentExpanded, setContentExpanded] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [showTTSPlayer, setShowTTSPlayer] = useState(false)
  const [showListenOptions, setShowListenOptions] = useState(false)
  const [showMarkedOnly, setShowMarkedOnly] = useState(false)
  const [showSystemInfo, setShowSystemInfo] = useState(false)

  // Fetch audio URL via cached context helper (24-hour signed URL)
  useEffect(() => {
    if (set?.audioFilePath) {
      getAudioUrl(id).then(url => setAudioUrl(url))
    }
  }, [set?.id, set?.audioFilePath]) // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Stable callbacks (defined before early returns so useCallback is unconditional) ───

  const handleOpenTTSPlayer = useCallback(() => setShowTTSPlayer(true), [])
  const handleCloseTTSPlayer = useCallback(() => setShowTTSPlayer(false), [])
  const handleChunkModeChange = useCallback((mode: ChunkMode) => {
    updateChunkMode(id, mode)
  }, [id, updateChunkMode])

  // Encode navigation
  const startPractice = useCallback((index: number) => {
    setPracticeChunkIndex(index)
    setPageMode("practice")
    updateSessionState(id, { currentStep: "encode", currentChunkIndex: index })
  }, [id, updateSessionState])

  const exitPractice = useCallback(() => {
    setPracticeChunkIndex(null)
    setPageMode("chunk-select")
  }, [])

  const finishEncoding = useCallback(() => {
    setPracticeChunkIndex(null)
    setPageMode("view")
    updateSessionState(id, { currentStep: null, currentChunkIndex: null, currentEncodeStage: null })
  }, [id, updateSessionState])

  const continueFromEncodeToTest = useCallback(() => {
    setPracticeChunkIndex(null)
    setPageMode("test-select")
  }, [])

  // Retry / next-chunk handlers for ProgressiveChunkEncoder
  const handleRetryEntireSelection = useCallback(() => {
    setPracticeChunkIndex(null)
    setTimeout(() => setPracticeChunkIndex(-1), 0)
  }, [])

  const handleNextChunk = useCallback(() => {
    if (practiceChunkIndex !== null) {
      const newIndex = practiceChunkIndex + 1
      setPracticeChunkIndex(newIndex)
      updateSessionState(id, { currentChunkIndex: newIndex })
    }
  }, [practiceChunkIndex, id, updateSessionState])

  const handleRetryChunk = useCallback(() => {
    const idx = practiceChunkIndex
    setPracticeChunkIndex(null)
    setTimeout(() => setPracticeChunkIndex(idx), 0)
  }, [practiceChunkIndex])

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

  // Encode chunk-select navigation
  const handleEncode = useCallback(() => {
    setPageMode("chunk-select")
    updateSessionState(id, { currentStep: "encode", currentChunkIndex: null, currentEncodeStage: null })
  }, [id, updateSessionState])

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
  }, [id, updateSessionState])

  const exitFirstLetterTest = useCallback(() => setPageMode("test-select"), [])

  const finishTesting = useCallback(() => {
    setPageMode("view")
    updateSessionState(id, { currentStep: null })
  }, [id, updateSessionState])

  const startTypingTest = useCallback(() => {
    setPageMode("typing-test")
    updateSessionState(id, { currentStep: "test" })
  }, [id, updateSessionState])

  const exitTypingTest = useCallback(() => setPageMode("test-select"), [])

  const startAudioTest = useCallback(() => {
    setPageMode("audio-test")
    updateSessionState(id, { currentStep: "test" })
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
          // Go to chunk selection
          setPageMode("chunk-select")
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
                              <p className="text-xs text-muted-foreground">Have the computer read it to you</p>
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
                      <h3 className="font-medium text-foreground">Listen Instead</h3>
                      <p className="text-sm text-muted-foreground">
                        Have the computer read the content aloud to you. Great for auditory learners.
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

  // Chunk selection mode
  if (pageMode === "chunk-select") {
    return (
      <SessionLayout
        step="Step 2"
        title="Encode"
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
          label: "Start from Beginning",
          onClick: () => startPractice(0),
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
                Choose a chunk to practice. Type the first letter of each word to reveal the full text.
              </p>
            </div>

            {/* Chunk List */}
            <div className="flex flex-col gap-3">
              {/* Practice Entire Selection */}
              <button
                onClick={() => startPractice(-1)}
                className="flex gap-3 rounded-lg border-2 border-primary/20 bg-primary/5 p-4 text-left transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary">
                  <Layers className="size-4" />
                </span>
                <div className="flex flex-1 flex-col gap-1">
                  <p className="font-medium text-primary">Practice Entire Selection</p>
                  <p className="text-sm text-muted-foreground">
                    Train all {chunks.length} {getChunkLabel(set.chunkMode, chunks.length)} • {wordCount} word{wordCount !== 1 ? "s" : ""}
                  </p>
                </div>
              </button>

              {chunks.map((chunk) => (
                <button
                  key={chunk.id}
                  onClick={() => startPractice(chunk.orderIndex)}
                  className="flex gap-3 rounded-lg border bg-card p-4 text-left transition-colors hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                    {chunk.orderIndex + 1}
                  </span>
                  <div className="flex flex-1 flex-col gap-2">
                    <p className="text-sm leading-relaxed line-clamp-3">{chunk.text}</p>
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

    const hasNextChunk = practiceChunkIndex < chunks.length - 1
    
    return (
      <SessionLayout
        step="Step 2"
        title={`Encode · Chunk ${practiceChunkIndex + 1}/${chunks.length}`}
        setTitle={set.title}
        onBack={exitPractice}
        showBottomActions={false}
      >
        <ProgressiveChunkEncoder 
          setId={id}
          chunk={currentChunk.text} 
          chunkIndex={practiceChunkIndex}
          totalChunks={chunks.length}
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
            {hasResumePoint() && (
              <Button size="sm" className="gap-1.5" onClick={handleResume}>
                <ArrowRight className="size-3.5" />
                <span className="text-sm">Resume</span>
              </Button>
            )}
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

        {/* Progress Over Time */}
        <ScoreChart setId={id} onStartTest={handleTest} />

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
