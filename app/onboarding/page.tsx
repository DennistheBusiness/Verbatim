"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight, BookOpen, Brain, CheckCircle2, ChevronLeft, Mic, Star, Upload, Zap } from "lucide-react"

import { Button } from "@/components/ui/button"

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [touchStart, setTouchStart] = useState(0)
  const [touchEnd, setTouchEnd] = useState(0)

  const totalSteps = 3 // 0-3 = 4 screens

  const handleComplete = () => {
    localStorage.setItem("hasSeenOnboarding", "true")
    router.push("/")
  }

  const handleSkip = () => {
    handleComplete()
  }

  const handleContinue = () => {
    if (step < totalSteps) {
      setStep(step + 1)
    }
  }

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1)
    }
  }

  const handleCreateFirst = () => {
    localStorage.setItem("hasSeenOnboarding", "true")
    router.push("/create")
  }

  const handleTouchStart = (e: React.TouchEvent) => {
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

    if (isLeftSwipe && step < totalSteps) {
      handleContinue()
    }

    if (isRightSwipe && step > 0) {
      handleBack()
    }

    setTouchStart(0)
    setTouchEnd(0)
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" && step < totalSteps) {
        handleContinue()
      }

      if (e.key === "ArrowLeft" && step > 0) {
        handleBack()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [step])

  const ProgressDots = () => (
    <div className="flex justify-center gap-2">
      {[...Array(totalSteps + 1)].map((_, i) => (
        <div
          key={i}
          className={`size-2 rounded-full transition-all ${
            i === step ? "bg-primary w-6" : "bg-muted"
          }`}
        />
      ))}
    </div>
  )

  const ScreenShell = ({
    children,
    maxWidth = "max-w-3xl",
  }: {
    children: React.ReactNode
    maxWidth?: string
  }) => (
    <div
      className="flex min-h-svh flex-col bg-background"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <main className="flex flex-1 flex-col items-center justify-center overflow-y-auto p-4 pb-8">
        <div className={`flex w-full flex-col gap-6 py-6 animate-in fade-in slide-in-from-bottom-4 duration-500 ${maxWidth}`}>
          <div className="flex items-center justify-between gap-3">
            {step > 0 ? (
              <Button variant="ghost" size="sm" className="gap-1" onClick={handleBack}>
                <ChevronLeft className="size-4" />
                Back
              </Button>
            ) : (
              <div className="w-16" />
            )}

            <span className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Step {step + 1} of {totalSteps + 1}
            </span>

            <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={handleSkip}>
              Skip
            </Button>
          </div>

          <ProgressDots />

          {children}
        </div>
      </main>
    </div>
  )

  if (step === 0) {
    return (
      <ScreenShell>
        <div className="flex justify-center">
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500/20 to-green-500/20 blur-2xl" />
            <div className="relative flex size-28 items-center justify-center rounded-full border-2 border-primary/20 bg-gradient-to-br from-blue-500/10 to-green-500/10">
              <Brain className="size-14 text-primary" strokeWidth={1.5} />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 text-center">
          <p className="text-sm font-medium text-primary">Who Verbatim is for</p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Built for subscribers who need reliable, word-for-word recall
          </h1>
          <p className="mx-auto max-w-2xl text-base leading-relaxed text-muted-foreground">
            Verbatim is for people learning scripts, speeches, passages, and presentations who want a clear system instead of guessing what to practice next.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border bg-gradient-to-br from-pink-500/5 via-purple-500/5 to-pink-500/5 p-5">
            <div className="mb-3 flex items-center gap-3">
              <span className="text-3xl">🎭</span>
              <h2 className="text-lg font-semibold">Performers</h2>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Memorize monologues, scenes, and lyrics without losing the exact wording.
            </p>
          </div>

          <div className="rounded-xl border bg-gradient-to-br from-orange-500/5 via-red-500/5 to-orange-500/5 p-5">
            <div className="mb-3 flex items-center gap-3">
              <span className="text-3xl">🎤</span>
              <h2 className="text-lg font-semibold">Speakers</h2>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Practice keynotes, sermons, toasts, and talks until delivery feels automatic.
            </p>
          </div>

          <div className="rounded-xl border bg-gradient-to-br from-blue-500/5 via-cyan-500/5 to-blue-500/5 p-5">
            <div className="mb-3 flex items-center gap-3">
              <span className="text-3xl">📚</span>
              <h2 className="text-lg font-semibold">Students</h2>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Learn poems, source texts, quotations, and presentation material in manageable chunks.
            </p>
          </div>

          <div className="rounded-xl border bg-gradient-to-br from-green-500/5 via-emerald-500/5 to-green-500/5 p-5">
            <div className="mb-3 flex items-center gap-3">
              <span className="text-3xl">⚖️</span>
              <h2 className="text-lg font-semibold">Professionals</h2>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Keep testimony, teaching, and client-facing language sharp when precision matters.
            </p>
          </div>
        </div>

        <div className="rounded-xl border bg-primary/5 p-4 text-left">
          <p className="text-sm text-foreground">
            <strong>Best fit:</strong> you already know what you need to memorize and want help turning it into a repeatable practice routine.
          </p>
        </div>

        <div className="flex flex-col gap-3 pt-2">
          <Button size="lg" className="w-full gap-2" onClick={handleContinue}>
            Show core features
            <ArrowRight className="size-4" />
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            This tour stays short, and you can skip it anytime.
          </p>
        </div>
      </ScreenShell>
    )
  }

  if (step === 1) {
    return (
      <ScreenShell maxWidth="max-w-4xl">
        <div className="flex flex-col gap-3 text-center">
          <p className="text-sm font-medium text-primary">Core features</p>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            The app gives you three tools that matter most
          </h2>
          <p className="mx-auto max-w-2xl text-base leading-relaxed text-muted-foreground">
            You do not need to learn every screen up front. These are the features subscribers use first to start memorizing quickly.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="flex flex-col gap-3 rounded-xl border bg-muted/30 p-5">
            <div className="flex size-12 items-center justify-center rounded-full bg-blue-500/10">
              <Upload className="size-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold">Bring material in fast</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Paste text or build a set from PDFs, images, and audio so you can start practicing without manual cleanup.
            </p>
          </div>

          <div className="flex flex-col gap-3 rounded-xl border bg-muted/30 p-5">
            <div className="flex size-12 items-center justify-center rounded-full bg-purple-500/10">
              <Zap className="size-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold">Practice with progressive cues</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              First-letter encoding and chunked practice help you reduce support gradually instead of jumping straight to full recall.
            </p>
          </div>

          <div className="flex flex-col gap-3 rounded-xl border bg-muted/30 p-5">
            <div className="flex size-12 items-center justify-center rounded-full bg-green-500/10">
              <Mic className="size-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold">Test and track recall</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Use flashcards, audio recall, and progress tracking to see what is solid and what still needs work.
            </p>
          </div>
        </div>

        <div className="rounded-xl border bg-background/80 p-4">
          <div className="flex items-start gap-3">
            <Star className="mt-0.5 size-5 shrink-0 text-amber-500" />
            <p className="text-sm leading-relaxed text-muted-foreground">
              Start with one set, one chunking style, and one test mode. You can add more once your routine feels natural.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Button size="lg" className="w-full gap-2" onClick={handleContinue}>
            Show me how it works
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </ScreenShell>
    )
  }


  if (step === 2) {
    return (
      <ScreenShell maxWidth="max-w-3xl">
        <div className="flex flex-col gap-3 text-center">
          <p className="text-sm font-medium text-primary">How to use the app</p>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            One loop, three moves. Repeat until it sticks.
          </h2>
          <p className="mx-auto max-w-2xl text-base leading-relaxed text-muted-foreground">
            Every practice session follows the same cycle: familiarize, encode progressively, then recall from memory.
          </p>
        </div>

        {/* Workflow steps */}
        <div className="flex flex-col gap-4 rounded-2xl border bg-muted/20 p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-sm font-semibold text-blue-600">1</div>
            <div className="flex-1 space-y-1">
              <h3 className="font-semibold">Create a set and split it into chunks</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">Paste your script, speech, or passage. Split it by paragraph, sentence, or line — one chunk at a time is all you practice.</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-purple-500/10 text-sm font-semibold text-purple-600">2</div>
            <div className="flex-1 space-y-1">
              <h3 className="font-semibold">Encode using the first letter of every word</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Each word is replaced by its first letter as a cue. You say the{" "}
                <strong className="text-foreground">full word out loud</strong> — the letter just prompts your memory.
                The display gets progressively harder:{" "}
                <span className="text-foreground">full text → first letters → blank</span>.
                Each level trains deeper recall.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-green-500/10 text-sm font-semibold text-green-600">3</div>
            <div className="flex-1 space-y-1">
              <h3 className="font-semibold">Test recall with no cues</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">Say or record the full chunk from memory. Mark what was hard and revisit it next session.</p>
            </div>
          </div>
        </div>

        {/* First letter example */}
        <div className="rounded-2xl border bg-muted/20 p-5 sm:p-6">
          <p className="mb-4 text-sm font-medium text-foreground">How encoding works — live example</p>
          <div className="flex flex-col gap-3">
            <div className="rounded-xl border bg-background p-4">
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Level 1 — Full text</p>
              <p className="text-sm text-foreground">&quot;To be or not to be, that is the question.&quot;</p>
            </div>
            <div className="rounded-xl border bg-background p-4">
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Level 2 — First letters only (you still say every word)</p>
              <p className="font-mono text-lg tracking-wider text-primary">T b o n t b, t i t q</p>
              <p className="mt-2 text-xs text-muted-foreground">
                You see <span className="font-mono text-primary">T</span> and say <em>&quot;To&quot;</em>, see{" "}
                <span className="font-mono text-primary">b</span> and say <em>&quot;be&quot;</em> — the letter cues your memory, it does not replace the word.
              </p>
            </div>
            <div className="rounded-xl border bg-background p-4">
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Level 3 — Blank (pure recall from memory)</p>
              <p className="font-mono text-lg tracking-wider text-muted-foreground/40">_ _ _ _ _ _, _ _ _ _</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-primary/5 p-4">
          <p className="text-sm text-foreground">
            <strong>Key point:</strong> you are always memorizing the full text. The first letters are training wheels that you gradually remove until you can recall everything without them.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Button size="lg" className="w-full gap-2" onClick={handleContinue}>
            I&apos;m ready to start
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </ScreenShell>
    )
  }

  return (
    <ScreenShell maxWidth="max-w-md">
      <div className="flex justify-center">
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500/20 to-green-500/20 blur-2xl" />
          <div className="relative flex size-28 items-center justify-center rounded-full border-2 border-primary/20 bg-gradient-to-br from-blue-500/10 to-green-500/10">
            <BookOpen className="size-14 text-primary" strokeWidth={1.5} />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 text-center">
        <p className="text-sm font-medium text-primary">Start here</p>
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          You’re ready to use the app
        </h2>
        <p className="text-base leading-relaxed text-muted-foreground">
          Create one set and run one practice cycle. That is enough to feel how Verbatim works.
        </p>
      </div>

      <div className="rounded-xl border bg-muted/20 p-4 text-left">
        <p className="text-sm text-muted-foreground">
          You can always replay this tour later from the app if you want a refresher.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <Button
          size="lg"
          className="w-full gap-2 brand-gradient-bg transition-opacity hover:opacity-90"
          onClick={handleCreateFirst}
        >
          <CheckCircle2 className="size-5" />
          Create your first set
        </Button>
        <Button variant="ghost" size="lg" className="w-full text-muted-foreground" onClick={handleComplete}>
          Browse library
        </Button>
      </div>
    </ScreenShell>
  )
}
