"use client"

import dynamic from "next/dynamic"
import { ArrowRight, FileText, Bookmark, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty"
import { SessionLayout } from "@/components/session-layout"
import type { MemorizationPageState } from "../types"

const FlashcardViewer = dynamic(
  () => import("@/components/flashcard-viewer").then((m) => ({ default: m.FlashcardViewer })),
  { ssr: false }
)

interface FlashcardViewProps {
  state: MemorizationPageState
}

export function FlashcardView({ state }: FlashcardViewProps) {
  const {
    set, id, chunks, hasContent,
    showMarkedOnly, setShowMarkedOnly,
    teachCTA, exitFlashcards,
    updateReviewedChunks, updateMarkedChunks,
  } = state

  if (!set) return null

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
        label: teachCTA.label,
        onClick: teachCTA.onClick,
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
