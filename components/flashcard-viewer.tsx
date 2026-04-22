"use client"

import { useState, useEffect, useCallback } from "react"
import { ChevronLeft, ChevronRight, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Flashcard } from "@/components/flashcard"
import { cn } from "@/lib/utils"
import type { Chunk } from "@/lib/memorization-context"

export interface FlashcardViewerProps {
  chunks: Chunk[]
  initialIndex?: number
  reviewedChunks: string[]
  markedChunks: string[]
  onUpdateReviewed: (chunkIds: string[]) => void
  onUpdateMarked: (chunkIds: string[]) => void
}

export function FlashcardViewer({
  chunks,
  initialIndex = 0,
  reviewedChunks,
  markedChunks,
  onUpdateReviewed,
  onUpdateMarked,
}: FlashcardViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [flashcardMode, setFlashcardMode] = useState<"simple" | "partial">("simple")
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)
  const [localReviewedChunks, setLocalReviewedChunks] = useState<Set<string>>(
    new Set(reviewedChunks)
  )
  const [localMarkedChunks, setLocalMarkedChunks] = useState<Set<string>>(
    new Set(markedChunks)
  )

  const currentChunk = chunks[currentIndex]
  const canGoPrevious = currentIndex > 0
  const canGoNext = currentIndex < chunks.length - 1

  // Mark current chunk as reviewed when viewed
  useEffect(() => {
    if (currentChunk && !localReviewedChunks.has(currentChunk.id)) {
      const newReviewed = new Set(localReviewedChunks)
      newReviewed.add(currentChunk.id)
      setLocalReviewedChunks(newReviewed)
      onUpdateReviewed(Array.from(newReviewed))
    }
  }, [currentChunk, localReviewedChunks, onUpdateReviewed])

  const goToPrevious = useCallback(() => {
    if (canGoPrevious) {
      setCurrentIndex((prev) => prev - 1)
    }
  }, [canGoPrevious])

  const goToNext = useCallback(() => {
    if (canGoNext) {
      setCurrentIndex((prev) => prev + 1)
    }
  }, [canGoNext])

  const toggleMark = useCallback(() => {
    if (!currentChunk) return

    const newMarked = new Set(localMarkedChunks)
    if (newMarked.has(currentChunk.id)) {
      newMarked.delete(currentChunk.id)
    } else {
      newMarked.add(currentChunk.id)
    }
    setLocalMarkedChunks(newMarked)
    onUpdateMarked(Array.from(newMarked))
  }, [currentChunk, localMarkedChunks, onUpdateMarked])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        goToPrevious()
      } else if (e.key === "ArrowRight") {
        goToNext()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [goToPrevious, goToNext])

  // Touch handlers for swipe gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return

    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > 50
    const isRightSwipe = distance < -50

    if (isLeftSwipe) {
      goToNext()
    } else if (isRightSwipe) {
      goToPrevious()
    }
  }

  const reviewedCount = localReviewedChunks.size
  const markedCount = localMarkedChunks.size

  if (!currentChunk) {
    return <div className="text-center text-muted-foreground">No chunks available</div>
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Progress indicator */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-3">
          <span className="font-medium">
            Chunk {currentIndex + 1} of {chunks.length}
          </span>
          <span className="text-muted-foreground">•</span>
          <span className="text-muted-foreground">
            {reviewedCount} reviewed
          </span>
          {markedCount > 0 && (
            <>
              <span className="text-muted-foreground">•</span>
              <span className="text-primary">
                {markedCount} marked
              </span>
            </>
          )}
        </div>

        {/* Mode toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setFlashcardMode(mode => mode === "simple" ? "partial" : "simple")}
          className="gap-2"
        >
          {flashcardMode === "simple" ? (
            <>
              <Eye className="size-4" />
              Simple
            </>
          ) : (
            <>
              <EyeOff className="size-4" />
              Partial
            </>
          )}
        </Button>
      </div>

      {/* Flashcard with navigation */}
      <div className="relative flex items-center justify-center gap-4">
        {/* Previous button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={goToPrevious}
          disabled={!canGoPrevious}
          className={cn(
            "absolute left-0 z-10 size-12 rounded-full shadow-md",
            "hidden md:flex",
            !canGoPrevious && "opacity-0 pointer-events-none"
          )}
          aria-label="Previous chunk"
        >
          <ChevronLeft className="size-6" />
        </Button>

        {/* Flashcard */}
        <div
          className="flex-1 max-w-4xl"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <Flashcard
            chunk={currentChunk}
            mode={flashcardMode}
            isMarked={localMarkedChunks.has(currentChunk.id)}
            onMark={toggleMark}
          />
        </div>

        {/* Next button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={goToNext}
          disabled={!canGoNext}
          className={cn(
            "absolute right-0 z-10 size-12 rounded-full shadow-md",
            "hidden md:flex",
            !canGoNext && "opacity-0 pointer-events-none"
          )}
          aria-label="Next chunk"
        >
          <ChevronRight className="size-6" />
        </Button>
      </div>

      {/* Mobile navigation buttons */}
      <div className="flex md:hidden gap-2">
        <Button
          variant="outline"
          onClick={goToPrevious}
          disabled={!canGoPrevious}
          className="flex-1 gap-2"
        >
          <ChevronLeft className="size-4" />
          Previous
        </Button>
        <Button
          variant="outline"
          onClick={goToNext}
          disabled={!canGoNext}
          className="flex-1 gap-2"
        >
          Next
          <ChevronRight className="size-4" />
        </Button>
      </div>

      {/* Swipe hint for mobile */}
      <p className="md:hidden text-xs text-center text-muted-foreground">
        Swipe left or right to navigate
      </p>
    </div>
  )
}
