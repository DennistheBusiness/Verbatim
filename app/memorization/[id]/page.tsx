"use client"

import { use } from "react"
import Link from "next/link"
import dynamic from "next/dynamic"
import { AlertCircle } from "lucide-react"
import { Header } from "@/components/header"
import { Spinner } from "@/components/ui/spinner"
import { Button } from "@/components/ui/button"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty"
import { SessionLayout } from "@/components/session-layout"
import { useMemorizationPage } from "./hooks/use-memorization-page"
import { FamiliarizeView } from "./views/FamiliarizeView"
import { FlashcardView } from "./views/FlashcardView"
import { EncodeSelectView } from "./views/EncodeSelectView"
import { ChunkSelectView } from "./views/ChunkSelectView"
import { TestSelectView } from "./views/TestSelectView"
import { PracticeView } from "./views/PracticeView"
import { HubView } from "./views/HubView"

// Lazy-load anything that pulls in framer-motion (Reorder / vaul / motion) so
// those modules are isolated in their own chunks and can't cause a TDZ
// "Cannot access before initialization" error in ProgressiveChunkEncoder.
const SortingGame = dynamic(
  () => import("@/components/sorting-game").then((m) => ({ default: m.SortingGame })),
  { ssr: false }
)
const FinishPhraseTest = dynamic(
  () => import("@/components/finish-phrase-test").then((m) => ({ default: m.FinishPhraseTest })),
  { ssr: false }
)
const FullFirstLetterTest = dynamic(
  () => import("@/components/full-first-letter-test").then((m) => ({ default: m.FullFirstLetterTest })),
  { ssr: false }
)
const TypingTest = dynamic(
  () => import("@/components/typing-test").then((m) => ({ default: m.TypingTest })),
  { ssr: false }
)
const AudioTest = dynamic(
  () => import("@/components/audio-test").then((m) => ({ default: m.AudioTest })),
  { ssr: false }
)

interface MemorizationDetailPageProps {
  params: Promise<{ id: string }>
}

export default function MemorizationDetailPage({ params }: MemorizationDetailPageProps) {
  const { id } = use(params)
  const state = useMemorizationPage(id)
  const { set, isLoaded, chunks, pageMode, exitSortingGame, finishSortingGame, exitFinishPhrase, exitFirstLetterTest, exitTypingTest, exitAudioTest, finishTesting, updateTestScore, updateChunkMode } = state

  if (!isLoaded) {
    return (
      <div className="flex min-h-svh flex-col">
        <Header title="" showBack />
        <main className="flex flex-1 flex-col items-center justify-center gap-3">
          <Spinner className="size-8" />
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

  switch (pageMode) {
    case "familiarize":
      return <FamiliarizeView state={state} />

    case "flashcards":
      return <FlashcardView state={state} />

    case "encode-method-select":
      return <EncodeSelectView state={state} />

    case "chunk-select":
      return <ChunkSelectView state={state} />

    case "test-select":
      return <TestSelectView state={state} />

    case "practice":
      return <PracticeView state={state} />

    case "finish-phrase":
      return (
        <SessionLayout step="Step 2" title="Finish That Phrase" setTitle={set.title} onBack={exitFinishPhrase} showBottomActions={false}>
          <FinishPhraseTest setId={id} chunks={chunks} onBack={exitFinishPhrase} />
        </SessionLayout>
      )

    case "sorting-game":
      return (
        <SortingGame
          setId={id}
          chunks={chunks}
          chunkMode={set.chunkMode}
          onChunkModeChange={(mode) => updateChunkMode(id, mode)}
          onBack={exitSortingGame}
          onFinish={finishSortingGame}
          onScore={(score) => updateTestScore(id, "sortingGame", score)}
        />
      )

    case "first-letter-test":
      return (
        <SessionLayout step="Step 3" title="First Letter Recall Test" setTitle={set.title} onBack={exitFirstLetterTest} showBottomActions={false}>
          <FullFirstLetterTest setId={id} content={set.content} onBack={finishTesting} />
        </SessionLayout>
      )

    case "typing-test":
      return (
        <SessionLayout step="Step 3" title="Full Recall Test" setTitle={set.title} onBack={exitTypingTest} showBottomActions={false}>
          <TypingTest setId={id} content={set.content} onBack={finishTesting} />
        </SessionLayout>
      )

    case "audio-test":
      return (
        <SessionLayout step="Step 3" title="Audio Recall Test" setTitle={set.title} onBack={exitAudioTest} showBottomActions={false}>
          <AudioTest setId={id} content={set.content} chunks={chunks} chunkMode={set.chunkMode} onBack={finishTesting} />
        </SessionLayout>
      )

    default:
      return <HubView state={state} />
  }
}
