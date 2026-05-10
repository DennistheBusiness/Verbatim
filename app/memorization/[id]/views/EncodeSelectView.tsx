"use client"

import { ArrowRight, Layers, LetterText, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SessionLayout } from "@/components/session-layout"
import type { ChunkMode } from "@/lib/memorization-context"
import { getChunkLabel } from "@/lib/utils/format-date"
import type { MemorizationPageState } from "../types"

interface EncodeSelectViewProps {
  state: MemorizationPageState
}

export function EncodeSelectView({ state }: EncodeSelectViewProps) {
  const {
    set, id, chunks, hasContent,
    trainCTA, exitEncodeMethodSelect,
    startSortingGame, startFirstLetterMethod, startFinishPhrase,
    updateChunkMode,
  } = state

  if (!set) return null

  return (
    <SessionLayout
      step="Step 2"
      title="Train"
      setTitle={set.title}
      onBack={exitEncodeMethodSelect}
      primaryAction={hasContent ? {
        label: trainCTA.label,
        onClick: trainCTA.onClick,
        icon: <ArrowRight className="size-4" />,
      } : undefined}
      secondaryAction={{ label: "Back to Detail", onClick: exitEncodeMethodSelect }}
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
          Choose a training method. All methods help reinforce recall from memory.
        </p>
      </div>

      <div className="flex flex-col gap-4">
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
              {chunks.length < 2 ? "Need at least 2 chunks" : "Start Game"}
            </Button>
          </CardContent>
        </Card>

        {/* First Letter Method */}
        <Card>
          <CardContent className="flex flex-col gap-4 py-5">
            <div className="flex items-start gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <LetterText className="size-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">First Letter Method</h3>
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

        {/* Finish That Phrase */}
        <Card>
          <CardContent className="flex flex-col gap-4 py-5">
            <div className="flex items-start gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <Sparkles className="size-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Finish That Phrase</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  See 20% of each chunk and recall the rest under the clock
                </p>
              </div>
            </div>
            <div className="rounded-lg bg-muted/30 p-3">
              <p className="text-sm text-muted-foreground">
                {chunks.length} {getChunkLabel(set.chunkMode, chunks.length)} · 3 seconds per hidden word
              </p>
            </div>
            <Button onClick={startFinishPhrase} className="w-full" disabled={!hasContent}>
              Start
            </Button>
          </CardContent>
        </Card>
      </div>
    </SessionLayout>
  )
}
