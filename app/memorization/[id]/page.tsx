"use client"

import { use, useState } from "react"
import Link from "next/link"
import { Header } from "@/components/header"
import { useMemorization, countWords, type ChunkMode } from "@/lib/memorization-context"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty"
import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import { Card, CardContent } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { AlertCircle, FileText, Layers, Type, Keyboard, LetterText, BookOpen, ArrowRight, Pencil } from "lucide-react"

import { ProgressiveChunkEncoder } from "@/components/progressive-chunk-encoder"
import { TypingTest } from "@/components/typing-test"
import { FullFirstLetterTest } from "@/components/full-first-letter-test"
import { GuidedFlow, type FlowStep } from "@/components/guided-flow"
import { SessionLayout } from "@/components/session-layout"

type PageMode = "view" | "familiarize" | "chunk-select" | "practice" | "test-select" | "first-letter-test" | "typing-test"

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

interface MemorizationDetailPageProps {
  params: Promise<{ id: string }>
}

export default function MemorizationDetailPage({ params }: MemorizationDetailPageProps) {
  const { id } = use(params)
  const { getSet, updateChunkMode, isLoaded } = useMemorization()
  const set = getSet(id)
  const [pageMode, setPageMode] = useState<PageMode>("view")
  const [practiceChunkIndex, setPracticeChunkIndex] = useState<number | null>(null)
  const [recommendedStep, setRecommendedStep] = useState<FlowStep>("familiarize")
  const [familiarizeView, setFamiliarizeView] = useState<"full" | "chunks">("full")

  const handleChunkModeChange = (mode: ChunkMode) => {
    if (set) {
      updateChunkMode(set.id, mode)
    }
  }

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

  const startPractice = (index: number) => {
    setPracticeChunkIndex(index)
    setPageMode("practice")
  }

  const exitPractice = () => {
    setPracticeChunkIndex(null)
    setPageMode("chunk-select")
  }

  const finishEncoding = () => {
    setPracticeChunkIndex(null)
    setPageMode("view")
    setRecommendedStep("test")
  }

  const continueFromEncodeToTest = () => {
    setPracticeChunkIndex(null)
    setRecommendedStep("test")
    setPageMode("test-select")
  }

  const handleFamiliarize = () => {
    setPageMode("familiarize")
  }

  const exitFamiliarize = () => {
    setPageMode("view")
    setRecommendedStep("encode")
  }

  const continueToEncode = () => {
    setRecommendedStep("encode")
    setPageMode("chunk-select")
  }

  const handleEncode = () => {
    setPageMode("chunk-select")
  }

  const exitChunkSelect = () => {
    setPageMode("view")
  }

  const handleTest = () => {
    setPageMode("test-select")
  }

  const exitTestSelect = () => {
    setPageMode("view")
  }

  const startFirstLetterTest = () => {
    setPageMode("first-letter-test")
  }

  const exitFirstLetterTest = () => {
    setPageMode("test-select")
  }

  const finishTesting = () => {
    setPageMode("view")
    setRecommendedStep("familiarize")
  }

  const startTypingTest = () => {
    setPageMode("typing-test")
  }

  const exitTypingTest = () => {
    setPageMode("test-select")
  }

  // Familiarize mode
  if (pageMode === "familiarize") {
    return (
      <SessionLayout
        step="Step 1"
        title="Familiarize"
        setTitle={set.title}
        onBack={exitFamiliarize}
        primaryAction={hasContent ? {
          label: "Continue to Encode",
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
            {/* Instructions */}
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="flex gap-4 py-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <BookOpen className="size-5 text-primary" />
                </div>
                <div className="flex flex-1 flex-col gap-1">
                  <h3 className="font-medium text-foreground">Read and Absorb</h3>
                  <p className="text-sm text-muted-foreground">
                    Take your time reading through the content. Focus on understanding the flow, key phrases, and structure.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* View Toggle and Stats */}
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
              <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
                <span>{wordCount} words</span>
                <span className="size-1 rounded-full bg-muted-foreground/30" />
                <span>{chunks.length} {set.chunkMode === "paragraph" ? "paragraph" : "sentence"}{chunks.length !== 1 ? "s" : ""}</span>
              </div>
            </div>

            {/* Content Display */}
            {familiarizeView === "full" ? (
              <Card>
                <CardContent className="py-5">
                  <p className="whitespace-pre-wrap text-base leading-7 text-foreground">
                    {set.content}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="flex flex-col gap-3">
                {chunks.map((chunk) => (
                  <Card key={chunk.id}>
                    <CardContent className="flex gap-4 py-4">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                        {chunk.orderIndex + 1}
                      </span>
                      <p className="flex-1 text-base leading-7 text-foreground">{chunk.text}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
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
                    Train all {chunks.length} {set.chunkMode === "paragraph" ? "paragraph" : "sentence"}{chunks.length !== 1 ? "s" : ""} • {wordCount} word{wordCount !== 1 ? "s" : ""}
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
      >
        {/* Instructions */}
        <div className="rounded-lg bg-muted/50 p-3">
          <p className="text-sm text-muted-foreground">
            Select a test method. Both methods test the entire passage and can earn you 100% completion.
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
                  <h3 className="font-semibold">First Letter Test</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Type the first letter of each word to reveal it.
                  </p>
                </div>
              </div>
              <div className="rounded-lg bg-muted/30 p-3">
                <p className="text-sm text-muted-foreground">
                  {wordCount} words · {chunks.length} {set.chunkMode === "paragraph" ? "paragraph" : "sentence"}{chunks.length !== 1 ? "s" : ""}
                </p>
              </div>
              <Button onClick={startFirstLetterTest} className="w-full">
                Start First Letter Test
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
                  <h3 className="font-semibold">Full Passage Test</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Type the entire passage from memory in one go.
                  </p>
                </div>
              </div>
              <div className="rounded-lg bg-muted/30 p-3">
                <p className="text-sm text-muted-foreground">
                  {wordCount} words · {chunks.length} {set.chunkMode === "paragraph" ? "paragraph" : "sentence"}{chunks.length !== 1 ? "s" : ""}
                </p>
              </div>
              <Button onClick={startTypingTest} className="w-full">
                Start Full Passage Test
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
        title="First Letter Test"
        setTitle={set.title}
        onBack={exitFirstLetterTest}
        showBottomActions={false}
      >
        <FullFirstLetterTest 
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
        title="Full Passage Test"
        setTitle={set.title}
        onBack={exitTypingTest}
        showBottomActions={false}
      >
        <TypingTest content={set.content} onBack={finishTesting} />
      </SessionLayout>
    )
  }

  // Practice mode
  if (pageMode === "practice" && practiceChunkIndex !== null) {
    // Handle entire selection mode
    if (practiceChunkIndex === -1) {
      const handleRetryEntireSelection = () => {
        setPracticeChunkIndex(null)
        setTimeout(() => setPracticeChunkIndex(-1), 0)
      }

      return (
        <SessionLayout
          step="Step 2"
          title="Encode · Entire Selection"
          setTitle={set.title}
          onBack={exitPractice}
          showBottomActions={false}
        >
          <ProgressiveChunkEncoder 
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
          title="Encode"
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
    
    const handleNextChunk = () => {
      if (hasNextChunk) {
        setPracticeChunkIndex(practiceChunkIndex + 1)
      }
    }

    const handleRetryChunk = () => {
      // Force re-render by setting to null then back
      setPracticeChunkIndex(null)
      setTimeout(() => setPracticeChunkIndex(practiceChunkIndex), 0)
    }
    
    return (
      <SessionLayout
        step="Step 2"
        title={`Encode · Chunk ${practiceChunkIndex + 1}/${chunks.length}`}
        setTitle={set.title}
        onBack={exitPractice}
        showBottomActions={false}
      >
        <ProgressiveChunkEncoder 
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

  // View mode
  return (
    <div className="flex min-h-svh flex-col">
      <Header 
        title={set.title} 
        showBack 
        action={
          <Button variant="ghost" size="icon-sm" asChild>
            <Link href={`/edit/${set.id}`}>
              <Pencil className="size-4" />
              <span className="sr-only">Edit</span>
            </Link>
          </Button>
        }
      />
      
      <main className="flex flex-1 flex-col gap-6 p-4 pb-8">
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
            <FileText className="size-4 text-muted-foreground" />
            <span className="text-lg font-semibold capitalize">{set.chunkMode}</span>
            <span className="text-xs text-muted-foreground">Mode</span>
          </div>
        </div>

        {/* Practice Section */}
        <GuidedFlow
          recommendedStep={recommendedStep}
          onFamiliarize={handleFamiliarize}
          onEncode={handleEncode}
          onTest={handleTest}
        />

        {/* Content Preview Section */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Content</h2>
            <ButtonGroup>
              <Button
                variant={set.chunkMode === "paragraph" ? "default" : "outline"}
                size="sm"
                onClick={() => handleChunkModeChange("paragraph")}
              >
                Paragraphs
              </Button>
              <Button
                variant={set.chunkMode === "sentence" ? "default" : "outline"}
                size="sm"
                onClick={() => handleChunkModeChange("sentence")}
              >
                Sentences
              </Button>
            </ButtonGroup>
          </div>

          <div className="flex flex-col gap-3">
            {chunks.slice(0, 3).map((chunk) => (
              <div 
                key={chunk.id} 
                className="flex gap-3 rounded-lg border bg-card p-4"
              >
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                  {chunk.orderIndex + 1}
                </span>
                <div className="flex flex-1 flex-col gap-2">
                  <p className="text-sm leading-relaxed line-clamp-3">{chunk.text}</p>
                </div>
              </div>
            ))}
            {chunks.length > 3 && (
              <p className="py-2 text-center text-sm text-muted-foreground">
                +{chunks.length - 3} more {set.chunkMode === "paragraph" ? "paragraph" : "sentence"}{chunks.length - 3 !== 1 ? "s" : ""}
              </p>
            )}
          </div>

          {/* Metadata */}
          <p className="text-xs text-muted-foreground">
            Created {formatDate(set.createdAt)}
            {set.updatedAt !== set.createdAt && (
              <> · Updated {formatDate(set.updatedAt)}</>
            )}
          </p>
        </div>
      </main>
    </div>
  )
}
