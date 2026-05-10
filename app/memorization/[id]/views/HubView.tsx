"use client"

import dynamic from "next/dynamic"
import Link from "next/link"
import {
  Flame, Type, Layers, Share2, Edit3, Trash2, HelpCircle, BarChart3,
  BookOpenText, StickyNote, AudioLines, ALargeSmall, PenLine, ListOrdered,
  NotebookPen, Hash, Mic2,
} from "lucide-react"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { CircleBtn } from "@/components/circle-btn"
import { formatDate } from "@/lib/utils/format-date"
import type { MemorizationPageState } from "../types"

const ShareDrawer = dynamic(
  () => import("@/components/share-drawer").then((m) => ({ default: m.ShareDrawer })),
  { ssr: false }
)
const ScoreChart = dynamic(
  () => import("@/components/score-chart").then((m) => ({ default: m.ScoreChart })),
  { ssr: false }
)
const MobileMemoNav = dynamic(
  () => import("@/components/mobile-memo-nav").then((m) => ({ default: m.MobileMemoNav })),
  { ssr: false }
)
const SRToggle = dynamic(
  () => import("@/components/sr-toggle").then((m) => ({ default: m.SRToggle })),
  { ssr: false }
)

interface HubViewProps {
  state: MemorizationPageState
}

export function HubView({ state }: HubViewProps) {
  const {
    set, id, chunks, wordCount, currentStreak,
    overallCompletion, stepProgress,
    showSharePanel, setShowSharePanel,
    shareUrl, shareCopied, shareLoading,
    showSystemInfo, setShowSystemInfo,
    isDeleting,
    progressModuleCTA,
    handleShare, handleCopyShareUrl, handleRevokeShare, handleDelete,
    handleFamiliarize, handleEncode, handleTest,
    startFamiliarizeReader, handleFlashcards, handleOpenTTSPlayer,
    startSortingGame, startFirstLetterMethod, startFinishPhrase,
    startTypingTest, startFirstLetterTest, startAudioTest,
    updateRepetitionMode,
  } = state

  if (!set) return null

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
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={handleShare}
              disabled={shareLoading}
            >
              {shareLoading ? (
                <><div className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" /><span className="text-sm hidden md:inline">Share</span></>
              ) : (
                <><Share2 className="size-3.5" /><span className="text-sm hidden md:inline">Share</span></>
              )}
            </Button>
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
          <Link href={`/analytics?set=${id}`}>
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 cursor-pointer transition-shadow hover:shadow-md active:opacity-90">
            <CardContent className="flex flex-col gap-4 p-5">
              {/* Headline % */}
              <div className="flex items-end justify-between">
                <div className="flex flex-col gap-0.5">
                  <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Overall</p>
                  <span className="text-5xl font-extrabold leading-none text-primary tabular-nums">{overallCompletion}<span className="text-2xl font-bold">%</span></span>
                </div>
                <p className="text-xs text-muted-foreground pb-1">
                  {overallCompletion === 0 ? "Just getting started" : overallCompletion < 40 ? "Building the foundation" : overallCompletion < 75 ? "Making solid progress" : overallCompletion < 100 ? "Almost there" : "Complete"}
                </p>
              </div>

              {/* 3-segment bar */}
              <div className="flex gap-1 h-3">
                <div className="flex-1 rounded-l-full overflow-hidden bg-blue-500/20">
                  <div className="h-full bg-blue-500 transition-all duration-500 rounded-l-full" style={{ width: `${stepProgress.teach}%` }} />
                </div>
                <div className="flex-1 overflow-hidden bg-violet-500/20">
                  <div className="h-full bg-violet-500 transition-all duration-500" style={{ width: `${stepProgress.train}%` }} />
                </div>
                <div className="flex-1 rounded-r-full overflow-hidden bg-emerald-500/20">
                  <div className="h-full bg-emerald-500 transition-all duration-500 rounded-r-full" style={{ width: `${stepProgress.test}%` }} />
                </div>
              </div>

              {/* Labels + status under each segment */}
              <div className="flex">
                <div className="flex-1 flex flex-col gap-0.5">
                  <span className="text-[11px] font-semibold text-blue-500">Teach</span>
                  <span className="text-[10px] text-muted-foreground leading-tight">
                    {set.progress.familiarizeCompleted ? "✓ Done" : (set.progress.reviewedChunks?.length ?? 0) > 0 ? `${set.progress.reviewedChunks!.length}/${chunks.length} cards` : "Not started"}
                  </span>
                </div>
                <div className="flex-1 flex flex-col gap-0.5">
                  <span className="text-[11px] font-semibold text-violet-500">Train</span>
                  <span className="text-[10px] text-muted-foreground leading-tight">
                    {stepProgress.trainStages === 0 ? "Not started" : stepProgress.trainStages === 3 ? "✓ Done" : `Stage ${stepProgress.trainStages}/3`}
                  </span>
                </div>
                <div className="flex-1 flex flex-col gap-0.5">
                  <span className="text-[11px] font-semibold text-emerald-500">Test</span>
                  <span className="text-[10px] text-muted-foreground leading-tight">
                    {stepProgress.test > 0 ? `Best: ${stepProgress.test}%` : "Not started"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
          </Link>
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
              <Flame className={`size-4 ${currentStreak > 0 ? "text-orange-500" : "text-muted-foreground"}`} />
              <span className="text-lg font-semibold tabular-nums">{currentStreak}</span>
              <span className="text-xs text-muted-foreground">Day streak</span>
            </div>
          </div>
        </div>

        {/* Share Panel */}
        <ShareDrawer
          open={showSharePanel}
          onOpenChange={setShowSharePanel}
          title={set.title}
          shareUrl={shareUrl}
          shareCopied={shareCopied}
          onCopy={handleCopyShareUrl}
          onRevoke={handleRevokeShare}
        />

        <Dialog open={showSystemInfo} onOpenChange={setShowSystemInfo}>
          <DialogContent className="max-w-sm gap-0 p-0 overflow-hidden">
            <DialogHeader className="px-5 pt-5 pb-4 border-b">
              <DialogTitle className="text-base font-semibold">Learning Methods</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col divide-y divide-border/50 text-sm overflow-y-auto max-h-[70vh]">
              {/* Teach */}
              <div className="px-5 py-3 bg-blue-500/5">
                <span className="text-[11px] font-bold uppercase tracking-widest text-blue-500">Teach</span>
              </div>
              {[
                { Icon: BookOpenText, name: "Read it yourself",  desc: "Read through your full content or chunk-by-chunk at your own pace." },
                { Icon: StickyNote,   name: "Flashcards",        desc: "Flip through each chunk one at a time to lock in the material." },
                { Icon: AudioLines,   name: "AI Read it",        desc: "Listen to an AI voice read the text aloud while you follow along." },
              ].map(({ Icon, name, desc }) => (
                <div key={name} className="flex items-start gap-3 px-5 py-3">
                  <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-blue-500/10">
                    <Icon className="size-3.5 text-blue-500" />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <p className="font-medium text-foreground leading-snug">{name}</p>
                    <p className="text-xs text-muted-foreground leading-snug">{desc}</p>
                  </div>
                </div>
              ))}

              {/* Train */}
              <div className="px-5 py-3 bg-violet-500/5">
                <span className="text-[11px] font-bold uppercase tracking-widest text-violet-500">Train</span>
              </div>
              {[
                { Icon: ALargeSmall,  name: "First Letter Method", desc: "See just the first letter of each word across 3 progressive reveal stages." },
                { Icon: PenLine,      name: "Finish that Phrase",  desc: "The first 20% of each chunk is shown -- type the rest from memory against the clock." },
                { Icon: ListOrdered,  name: "Sorting Game",        desc: "Drag and drop scrambled chunks back into their correct order." },
              ].map(({ Icon, name, desc }) => (
                <div key={name} className="flex items-start gap-3 px-5 py-3">
                  <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-violet-500/10">
                    <Icon className="size-3.5 text-violet-500" />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <p className="font-medium text-foreground leading-snug">{name}</p>
                    <p className="text-xs text-muted-foreground leading-snug">{desc}</p>
                  </div>
                </div>
              ))}

              {/* Test */}
              <div className="px-5 py-3 bg-emerald-500/5">
                <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-500">Test</span>
              </div>
              {[
                { Icon: NotebookPen, name: "Full Recall",      desc: "Type the entire passage from memory with no prompts or hints." },
                { Icon: Hash,        name: "1st Ltr Recall",   desc: "Type only the first letter of every word to prove you know the sequence." },
                { Icon: Mic2,        name: "Audio Recall",     desc: "Record yourself reciting the passage -- reviewed and scored afterward." },
              ].map(({ Icon, name, desc }) => (
                <div key={name} className="flex items-start gap-3 px-5 py-3">
                  <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/10">
                    <Icon className="size-3.5 text-emerald-500" />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <p className="font-medium text-foreground leading-snug">{name}</p>
                    <p className="text-xs text-muted-foreground leading-snug">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>

        {/* Spaced Repetition */}
        <SRToggle
          mode={set.repetitionMode}
          config={set.repetitionConfig}
          onModeChange={(mode, config) => updateRepetitionMode(id, mode, config)}
        />

        {/* Learning Steps -- circular progress grid */}
        <div className="-mx-4 flex flex-col">
          <div className="px-4 pb-3 flex items-center gap-1.5">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Learning Steps</h2>
            <button
              onClick={() => setShowSystemInfo(true)}
              className="flex items-center justify-center size-5 rounded-full text-muted-foreground/50 hover:text-muted-foreground transition-colors"
              aria-label="About learning methods"
            >
              <HelpCircle className="size-4" />
            </button>
          </div>

          {/* TEACH */}
          <div className="border-y border-border/40 bg-muted/40 px-4 py-2">
            <span className="text-[13px] font-semibold text-foreground/60">Teach</span>
          </div>
          <div className="flex justify-around px-4 py-6">
            <CircleBtn Icon={BookOpenText} label="Read it yourself" onClick={startFamiliarizeReader} color="blue"
              progress={set.progress.familiarizeCompleted ? 1 : 0} />
            <CircleBtn Icon={StickyNote} label="Flashcards" onClick={handleFlashcards} color="blue"
              progress={chunks.length > 0 ? Math.min((set.progress.reviewedChunks?.length ?? 0) / chunks.length, 1) : 0} />
            <CircleBtn Icon={AudioLines} label="AI Read it" onClick={handleOpenTTSPlayer} color="blue" progress={0} />
          </div>

          {/* TRAIN */}
          <div className="border-y border-border/40 bg-muted/40 px-4 py-2">
            <span className="text-[13px] font-semibold text-foreground/60">Train</span>
          </div>
          <div className="flex justify-around px-4 py-6">
            <CircleBtn Icon={ListOrdered} label="Sorting Game" onClick={startSortingGame} color="violet" progress={(set.progress.tests.sortingGame?.bestScore ?? 0) / 100} />
            <CircleBtn Icon={ALargeSmall} label="First Letter Method" onClick={startFirstLetterMethod} color="violet"
              progress={[set.progress.encode.stage1Completed, set.progress.encode.stage2Completed, set.progress.encode.stage3Completed].filter(Boolean).length / 3} />
            <CircleBtn Icon={PenLine} label="Finish that Phrase" onClick={startFinishPhrase} color="violet"
              progress={(set.progress.tests.finishPhrase?.bestScore ?? 0) / 100} />
          </div>

          {/* TEST */}
          <div className="border-y border-border/40 bg-muted/40 px-4 py-2">
            <span className="text-[13px] font-semibold text-foreground/60">Test</span>
          </div>
          <div className="flex justify-around px-4 py-6">
            <CircleBtn Icon={NotebookPen} label="Full Recall" onClick={startTypingTest} color="emerald"
              progress={(set.progress.tests.fullText.bestScore ?? 0) / 100} />
            <CircleBtn Icon={Hash} label="1st Ltr Recall" onClick={startFirstLetterTest} color="emerald"
              progress={(set.progress.tests.firstLetter.bestScore ?? 0) / 100} />
            <CircleBtn Icon={Mic2} label="Audio Recall" onClick={startAudioTest} color="emerald"
              progress={(set.progress.tests.audioTest.bestScore ?? 0) / 100} />
          </div>
        </div>

        {/* Score Charts */}
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Score Charts</h2>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/analytics?set=${id}`}>
              <BarChart3 className="size-3.5" />
              <span>View Full Charts</span>
            </Link>
          </Button>
        </div>

        <ScoreChart
          setId={id}
          onStartTest={progressModuleCTA.onClick}
          emptyStateCtaLabel={progressModuleCTA.label}
          emptyStateDescription={progressModuleCTA.description}
        />

        {/* Control Center */}
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium text-center uppercase tracking-wider text-muted-foreground">Memorization Control Center</p>
          <p className="text-xs text-center text-muted-foreground">Created {formatDate(set.createdAt)}</p>
          <div className="grid grid-cols-3 gap-2">
            <Button variant="outline" size="sm" className="gap-1.5" asChild>
              <Link href={`/edit/${set.id}`}>
                <Edit3 className="size-4" />
                Edit
              </Link>
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={handleShare} disabled={shareLoading}>
              {shareLoading
                ? <div className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                : <Share2 className="size-4" />}
              Share
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5 text-destructive hover:text-destructive border-destructive/30 hover:border-destructive/60">
                  <Trash2 className="size-4" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete memorization?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete &ldquo;{set.title}&rdquo; and all your progress. This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {isDeleting ? "Deleting..." : "Delete"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
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
