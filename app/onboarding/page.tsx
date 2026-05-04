"use client"

import { Suspense, useEffect, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import { ArrowRight, BookOpen, Brain, CheckCircle2, ChevronLeft, Loader2, Mic, Share2, Star, Upload, XCircle, Zap } from "lucide-react"

import { Button } from "@/components/ui/button"

export default function OnboardingPage() {
  return (
    <Suspense>
      <OnboardingContent />
    </Suspense>
  )
}

type ImportStatus = 'idle' | 'loading' | 'done' | 'error'

function OnboardingContent() {
  const searchParams = useSearchParams()
  const importShare = searchParams.get('importShare')
  const [step, setStep] = useState(0)

  // Import state — tracked so the final step can show status + we can await before navigating
  const [importStatus, setImportStatus] = useState<ImportStatus>('idle')
  const [importedSetId, setImportedSetId] = useState<string | null>(null)
  const [importedTitle, setImportedTitle] = useState<string | null>(null)
  // Ref keeps the promise so we can await it from any exit path (skip, back, etc.)
  const importPromise = useRef<Promise<void> | null>(null)

  const totalSteps = 3 // 0–3 = 4 screens; last screen differs for share users

  useEffect(() => {
    if (!importShare) return
    setImportStatus('loading')
    const p = fetch(`/api/share/${importShare}/import`, { method: 'POST' })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(({ importedSetId: id, title }: { importedSetId: string; title: string }) => {
        setImportedSetId(id)
        setImportedTitle(title)
        setImportStatus('done')
      })
      .catch(() => setImportStatus('error'))
    importPromise.current = p
  }, [importShare]) // eslint-disable-line react-hooks/exhaustive-deps

  // All navigation out of onboarding goes through here.
  // For share users we must do a full-page reload so the MemorizationProvider
  // (mounted in root layout, not unmounted by router.push) re-fetches and picks
  // up the newly imported set.
  const navigateTo = async (path: string) => {
    localStorage.setItem("hasSeenOnboarding", "true")
    if (importShare && importPromise.current) {
      // Wait for import to finish (usually already done; < 1 s server round-trip)
      await importPromise.current
    }
    window.location.href = path
  }

  const handleComplete = () => navigateTo("/")
  const handleSkip = () => navigateTo("/")
  const handleCreateFirst = () => navigateTo("/create")
  const handleStartPracticing = () => {
    if (importedSetId) navigateTo(`/memorization/${importedSetId}`)
    else navigateTo("/")
  }

  const handleContinue = () => {
    if (step < totalSteps) setStep(step + 1)
  }

  const handleBack = () => {
    if (step > 0) setStep(step - 1)
  }

  // Swipe + keyboard navigation
  useEffect(() => {
    let startX = 0
    let startY = 0

    const onTouchStart = (e: TouchEvent) => {
      const target = e.target as HTMLElement
      if (target.closest('button, a, input, textarea, [role="button"]')) return
      startX = e.touches[0].clientX
      startY = e.touches[0].clientY
    }

    const onTouchEnd = (e: TouchEvent) => {
      if (!startX) return
      const dx = startX - e.changedTouches[0].clientX
      const dy = Math.abs(startY - e.changedTouches[0].clientY)
      if (Math.abs(dx) > 50 && Math.abs(dx) > dy * 1.5) {
        if (dx > 0 && step < totalSteps) setStep(s => s + 1)
        if (dx < 0 && step > 0) setStep(s => s - 1)
      }
      startX = 0
      startY = 0
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" && step < totalSteps) setStep(s => s + 1)
      if (e.key === "ArrowLeft" && step > 0) setStep(s => s - 1)
    }

    document.addEventListener('touchstart', onTouchStart, { passive: true })
    document.addEventListener('touchend', onTouchEnd, { passive: true })
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('touchstart', onTouchStart)
      document.removeEventListener('touchend', onTouchEnd)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [step, totalSteps])

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
    <div className="flex min-h-svh flex-col bg-background">
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

  // ── Step 0 ─────────────────────────────────────────────────────────────────
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
          <Button variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={handleSkip}>
            Skip tour
          </Button>
        </div>
      </ScreenShell>
    )
  }

  // ── Step 1 ─────────────────────────────────────────────────────────────────
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
          <Button variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={handleSkip}>
            Skip tour
          </Button>
        </div>
      </ScreenShell>
    )
  }

  // ── Step 2 ─────────────────────────────────────────────────────────────────
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
          <Button variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={handleSkip}>
            Skip tour
          </Button>
        </div>
      </ScreenShell>
    )
  }

  // ── Step 3 — share-link users: show their imported set ─────────────────────
  if (importShare) {
    return (
      <ScreenShell maxWidth="max-w-md">
        <div className="flex justify-center">
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500/20 to-green-500/20 blur-2xl" />
            <div className="relative flex size-28 items-center justify-center rounded-full border-2 border-primary/20 bg-gradient-to-br from-blue-500/10 to-green-500/10">
              <Share2 className="size-14 text-primary" strokeWidth={1.5} />
            </div>
          </div>
        </div>

        {importStatus === 'loading' && (
          <>
            <div className="flex flex-col gap-3 text-center">
              <p className="text-sm font-medium text-primary">Almost there</p>
              <h2 className="text-3xl font-bold tracking-tight">
                Adding your shared set&hellip;
              </h2>
              <p className="text-base leading-relaxed text-muted-foreground">
                We&apos;re importing the memorization set that was shared with you. This only takes a moment.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 rounded-xl border bg-muted/30 p-5">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Importing set&hellip;</span>
            </div>
            <Button variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={handleComplete} disabled>
              Please wait&hellip;
            </Button>
          </>
        )}

        {importStatus === 'done' && (
          <>
            <div className="flex flex-col gap-3 text-center">
              <p className="text-sm font-medium text-primary">Ready to practice</p>
              <h2 className="text-3xl font-bold tracking-tight">
                Your shared set is in your library
              </h2>
              <p className="text-base leading-relaxed text-muted-foreground">
                It&apos;s been added to your account and is ready to practice right now.
              </p>
            </div>

            <div className="flex items-start gap-4 rounded-xl border bg-muted/30 p-5">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <CheckCircle2 className="size-5 text-primary" />
              </div>
              <div className="flex flex-col gap-0.5">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Imported set</p>
                <p className="font-semibold leading-snug">{importedTitle ?? 'Untitled'}</p>
              </div>
            </div>

            <div className="rounded-xl border bg-primary/5 p-4">
              <p className="text-sm text-muted-foreground">
                Start with <strong className="text-foreground">Familiarize</strong> — read through the material before you practice recall. The app will guide you from there.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <Button
                size="lg"
                className="w-full gap-2 brand-gradient-bg transition-opacity hover:opacity-90"
                onClick={handleStartPracticing}
              >
                <BookOpen className="size-5" />
                Start Practicing
              </Button>
              <Button variant="ghost" size="lg" className="w-full text-muted-foreground" onClick={handleComplete}>
                Browse library
              </Button>
            </div>
          </>
        )}

        {importStatus === 'error' && (
          <>
            <div className="flex flex-col gap-3 text-center">
              <p className="text-sm font-medium text-destructive">Import failed</p>
              <h2 className="text-3xl font-bold tracking-tight">
                Couldn&apos;t add the shared set
              </h2>
              <p className="text-base leading-relaxed text-muted-foreground">
                The share link may have expired or the set was removed. You can still use Verbatim normally.
              </p>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-5">
              <XCircle className="size-5 shrink-0 text-destructive" />
              <p className="text-sm text-muted-foreground">The shared memorization set could not be imported.</p>
            </div>
            <div className="flex flex-col gap-3">
              <Button size="lg" className="w-full gap-2" onClick={handleComplete}>
                Go to my library
                <ArrowRight className="size-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="w-full gap-2"
                onClick={handleCreateFirst}
              >
                Create a set instead
              </Button>
            </div>
          </>
        )}
      </ScreenShell>
    )
  }

  // ── Step 3 — standard users: create first set ──────────────────────────────
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
          You&apos;re ready to use the app
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
