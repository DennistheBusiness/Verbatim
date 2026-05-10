"use client"

import dynamic from "next/dynamic"
import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty"
import { SessionLayout } from "@/components/session-layout"
import type { MemorizationPageState } from "../types"

const ProgressiveChunkEncoder = dynamic(
  () => import("@/components/progressive-chunk-encoder").then((m) => ({ default: m.ProgressiveChunkEncoder })),
  { ssr: false }
)

interface PracticeViewProps {
  state: MemorizationPageState
}

export function PracticeView({ state }: PracticeViewProps) {
  const {
    set, id, chunks,
    practiceChunkIndex, practiceOverrideContent,
    selectedPracticeChunkIndexes, practiceQueuePosition, chunkSelectPurpose,
    exitPractice, finishEncoding, continueFromEncodeToTest,
    backToFirstLetterChunkSelect,
    handleRetryEntireSelection, handleRetryChunk, handleNextChunk,
  } = state

  if (!set || practiceChunkIndex === null) return null

  // Sentinel: -1 means "entire combined selection"
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
          chunk={practiceOverrideContent || set.content}
          chunkIndex={0}
          totalChunks={1}
          onRetryChunk={handleRetryEntireSelection}
          onContinueToTest={chunkSelectPurpose !== "first-letter" ? continueFromEncodeToTest : undefined}
          onBackToDetail={chunkSelectPurpose !== "first-letter" ? finishEncoding : undefined}
          onBackToChunkSelect={chunkSelectPurpose === "first-letter" ? backToFirstLetterChunkSelect : undefined}
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
