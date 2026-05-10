"use client"

import dynamic from "next/dynamic"
import { ArrowRight, BookOpen, BookMarked, Headphones, Volume2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import { Card, CardContent } from "@/components/ui/card"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SessionLayout } from "@/components/session-layout"
import type { ChunkMode } from "@/lib/memorization-context"
import { getChunkLabel } from "@/lib/utils/format-date"
import { ChevronDown, ChevronUp, FileText } from "lucide-react"
import type { MemorizationPageState } from "../types"

const TextToSpeechPlayer = dynamic(
  () => import("@/components/text-to-speech-player").then((m) => ({ default: m.TextToSpeechPlayer })),
  { ssr: false }
)
const TimedAudioPlayer = dynamic(
  () => import("@/components/timed-audio-player").then((m) => ({ default: m.TimedAudioPlayer })),
  { ssr: false }
)

interface FamiliarizeViewProps {
  state: MemorizationPageState
}

export function FamiliarizeView({ state }: FamiliarizeViewProps) {
  const {
    set, id, chunks, wordCount, hasContent,
    familiarizeSubView, setFamiliarizeSubView,
    familiarizeView, setFamiliarizeView,
    contentExpanded, setContentExpanded,
    audioUrl, showTTSPlayer, showListenOptions, setShowListenOptions,
    teachCTA, exitFamiliarize, handleOpenTTSPlayer, handleCloseTTSPlayer,
    startFamiliarizeReader, handleFlashcards,
    updateChunkMode,
  } = state

  if (!set) return null

  // TTS sub-view
  if (familiarizeSubView === "tts") {
    return (
      <SessionLayout
        step="Step 1"
        title="AI Read Aloud"
        setTitle={set.title}
        onBack={() => setFamiliarizeSubView("landing")}
        primaryAction={{
          label: teachCTA.label,
          onClick: teachCTA.onClick,
          icon: <ArrowRight className="size-4" />,
        }}
        secondaryAction={{
          label: "Back to Overview",
          onClick: () => setFamiliarizeSubView("landing"),
        }}
      >
        <TextToSpeechPlayer
          content={set.content}
          onClose={() => setFamiliarizeSubView("landing")}
        />
      </SessionLayout>
    )
  }

  // Reader sub-view: shows content with view toggle and chunk selector
  if (familiarizeSubView === "reader" && hasContent) {
    return (
      <SessionLayout
        step="Step 1"
        title="Familiarize"
        setTitle={set.title}
        onBack={exitFamiliarize}
        primaryAction={{
          label: teachCTA.label,
          onClick: teachCTA.onClick,
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

          {/* Chunk Mode Selector as dropdown -- only in chunk view */}
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
              <p className="whitespace-pre-wrap text-base leading-7 text-foreground">
                {set.content}
              </p>
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
        label: teachCTA.label,
        onClick: teachCTA.onClick,
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
                  onClick={startFamiliarizeReader}
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
                    {(set.progress.markedChunks?.length ?? 0) > 0 && ` ${set.progress.markedChunks!.length} marked for review.`}
                  </p>
                </div>
                <Button onClick={handleFlashcards} className="w-full sm:w-auto" size="sm">
                  Start Flashcards
                  <ArrowRight className="size-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Listen Section -- combined when recording exists, TTS-only when not */}
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
