"use client"

import { FileText, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SessionLayout } from "@/components/session-layout"
import { countWords } from "@/lib/memorization-context"
import type { ChunkMode } from "@/lib/memorization-context"
import { getChunkLabel } from "@/lib/utils/format-date"
import type { MemorizationPageState } from "../types"

interface ChunkSelectViewProps {
  state: MemorizationPageState
}

export function ChunkSelectView({ state }: ChunkSelectViewProps) {
  const {
    set, id, chunks, hasContent,
    selectedPracticeChunkIndexes, selectedPracticeWordCount, chunkSelectPurpose,
    exitChunkSelect, continueFromEncodeToTest,
    startCombinedPractice, startPracticeQueue,
    togglePracticeChunkSelection, selectAllPracticeChunks, clearPracticeChunkSelection,
    updateChunkMode,
  } = state

  if (!set) return null

  const selectedPracticeCount = selectedPracticeChunkIndexes.length

  return (
    <SessionLayout
      step="Step 2"
      title="First Letter Method"
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
        label: chunkSelectPurpose === "first-letter"
          ? selectedPracticeCount > 0
            ? `Start First Letter · ${selectedPracticeCount} ${getChunkLabel(set.chunkMode, selectedPracticeCount)}`
            : "Select chunks to train"
          : selectedPracticeCount === chunks.length
            ? "Train Entire Selection"
            : selectedPracticeCount > 0
              ? `Start Practice · ${selectedPracticeCount} ${getChunkLabel(set.chunkMode, selectedPracticeCount)}`
              : "Select chunks to practice",
        onClick: chunkSelectPurpose === "first-letter"
          ? () => startCombinedPractice(selectedPracticeChunkIndexes)
          : () => startPracticeQueue(selectedPracticeChunkIndexes),
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
              {chunkSelectPurpose === "first-letter"
                ? "Select chunks to combine into one First Letter Method exercise. All selected chunks are trained together."
                : "Select specific chunks to practice one by one, or select all to train on the entire text as a single 3-stage exercise."}
            </p>
          </div>

          <div className="flex items-center justify-between gap-3 rounded-lg border bg-card px-3 py-2">
            <div className="flex flex-col">
              <span className="text-sm font-medium">{selectedPracticeCount} selected</span>
              <span className="text-xs text-muted-foreground">
                {chunkSelectPurpose === "first-letter"
                  ? selectedPracticeCount > 0
                    ? `${selectedPracticeWordCount} words combined`
                    : "Tap chunks below to select"
                  : selectedPracticeCount === chunks.length
                    ? "Full text · 3-stage progressive exercise"
                    : selectedPracticeCount > 0
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
