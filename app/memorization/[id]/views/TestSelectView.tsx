"use client"

import { ArrowRight, LetterText, Keyboard, Mic } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SessionLayout } from "@/components/session-layout"
import type { ChunkMode } from "@/lib/memorization-context"
import { getChunkLabel } from "@/lib/utils/format-date"
import type { MemorizationPageState } from "../types"

interface TestSelectViewProps {
  state: MemorizationPageState
}

export function TestSelectView({ state }: TestSelectViewProps) {
  const {
    set, id, chunks, hasContent, wordCount,
    testCTA, exitTestSelect,
    startFirstLetterTest, startTypingTest, startAudioTest,
    updateChunkMode,
  } = state

  if (!set) return null

  return (
    <SessionLayout
      step="Step 3"
      title="Test"
      setTitle={set.title}
      onBack={exitTestSelect}
      primaryAction={hasContent ? {
        label: testCTA.label,
        onClick: testCTA.onClick,
        icon: <ArrowRight className="size-4" />,
      } : undefined}
      secondaryAction={{ label: "Back to Detail", onClick: exitTestSelect }}
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
