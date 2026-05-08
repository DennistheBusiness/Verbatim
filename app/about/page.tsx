"use client"

import { Header } from "@/components/header"
import { Card, CardContent } from "@/components/ui/card"
import { Brain, Target, Zap, Eye, BookMarked, Mic, BarChart, Clock, Share2, ListOrdered, MessageSquareDiff, Repeat2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import Image from "next/image"

export default function AboutPage() {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <Header title="About Verbatim" showBack />

      <main className="flex flex-1 flex-col gap-8 p-4 pb-8 max-w-4xl mx-auto w-full">
        {/* Hero Section */}
        <div className="flex flex-col gap-6 items-center text-center pt-4">
          <div className="flex items-center gap-3">
            <Image
              src="/verbatim-logo-icon.png"
              alt="Verbatim"
              width={64}
              height={64}
              className="shrink-0"
            />
            <div className="flex flex-col items-start">
              <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-[oklch(0.55_0.22_240)] to-[oklch(0.65_0.20_150)] bg-clip-text text-transparent">
                Verbatim
              </h1>
              <span className="text-sm text-muted-foreground">by Squared Thought</span>
            </div>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Master any text, word for word. Verbatim combines science-backed memorization techniques with a modern, mobile-first experience — so you can speak, teach, perform, and inspire with confidence.
          </p>
        </div>

        {/* The Science Section */}
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="p-8">
            <div className="flex items-start gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/20">
                <Brain className="size-6 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-3">Built on Science</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Verbatim draws on decades of memory research — spaced repetition, active recall, progressive cue reduction, and retrieval practice. These techniques don't just help you memorize; they help you remember under pressure, when it counts.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* The 3-Step System */}
        <div className="flex flex-col gap-4">
          <h2 className="text-2xl font-bold">The 3-Step System</h2>
          <p className="text-muted-foreground">
            Every memorization set moves through three stages. Nine learning modes — three per step — let you approach your material from multiple angles.
          </p>

          {/* Teach */}
          <Card className="border-blue-500/20">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-blue-500/10">
                  <Eye className="size-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-2">Step 1: Teach</h3>
                  <p className="text-muted-foreground mb-4">
                    Build familiarity before you start drilling. Read your content, listen to it, or study it chunk by chunk — whatever gets you comfortable with the material.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs px-2 py-1 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-400 font-medium">
                      Read it Yourself
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-400 font-medium">
                      Flashcards
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-400 font-medium">
                      AI Read it
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Train */}
          <Card className="border-violet-500/20">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-violet-500/10">
                  <Zap className="size-6 text-violet-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-2">Step 2: Train</h3>
                  <p className="text-muted-foreground mb-4">
                    Active training cements memory. Choose from three methods that challenge you to reconstruct your text from progressively fewer cues.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs px-2 py-1 rounded-full bg-violet-500/10 text-violet-700 dark:text-violet-400 font-medium">
                      First Letter (3 Stages)
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full bg-violet-500/10 text-violet-700 dark:text-violet-400 font-medium">
                      Finish That Phrase
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full bg-violet-500/10 text-violet-700 dark:text-violet-400 font-medium">
                      Sorting Game
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Test */}
          <Card className="border-emerald-500/20">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-emerald-500/10">
                  <Target className="size-6 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-2">Step 3: Test</h3>
                  <p className="text-muted-foreground mb-4">
                    Prove you know it cold. Test modes stress-test your recall with no scaffolding — type it, say it, or reconstruct it from just the first letters.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-medium">
                      Full Recall
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-medium">
                      First Letter Recall
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-medium">
                      Audio Recall
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* First Letter Deep Dive */}
        <div className="flex flex-col gap-4">
          <h2 className="text-2xl font-bold">The First Letter Method</h2>
          <p className="text-muted-foreground">
            Our signature encoding technique — used across both Train and Test modes.
          </p>
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col gap-4">
                <div className="bg-muted/30 p-4 rounded-lg">
                  <p className="text-sm font-medium text-muted-foreground mb-2">Original Text:</p>
                  <p className="text-base">"To be or not to be, that is the question"</p>
                </div>

                <div className="flex items-center justify-center">
                  <div className="h-8 w-px bg-border" />
                </div>

                <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                  <p className="text-sm font-medium text-primary mb-2">First Letters:</p>
                  <p className="font-mono text-lg tracking-wider text-foreground">
                    T b o n t b, t i t q
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">How it works:</strong> The first letter acts as a retrieval cue, triggering recall of the full word. Three progressive levels gradually remove those cues until you recall the entire text from memory alone.
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">Why it works:</strong> First-letter encoding leverages your brain's pattern recognition and builds strong retrieval pathways — so the text comes back reliably, even under pressure.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Key Features */}
        <div className="flex flex-col gap-4">
          <h2 className="text-2xl font-bold">Powerful Features</h2>

          <div className="grid sm:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <BookMarked className="size-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">Interactive Flashcards</h3>
                    <p className="text-sm text-muted-foreground">
                      Swipe through chunks, bookmark key sections, and filter to review only what matters.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Mic className="size-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">Audio Recall Testing</h3>
                    <p className="text-sm text-muted-foreground">
                      Recite your text aloud and get instant AI-powered transcription and accuracy scoring.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <ListOrdered className="size-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">Sorting Game</h3>
                    <p className="text-sm text-muted-foreground">
                      Drag shuffled chunks back into the correct sequence. Locks in structure and order.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <MessageSquareDiff className="size-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">Finish That Phrase</h3>
                    <p className="text-sm text-muted-foreground">
                      See the beginning of each chunk and complete it from memory — active recall made approachable.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Repeat2 className="size-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">Spaced Repetition</h3>
                    <p className="text-sm text-muted-foreground">
                      Automatically schedules review sessions at the right intervals to keep memory sharp long-term.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Share2 className="size-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">Share Sets</h3>
                    <p className="text-sm text-muted-foreground">
                      Generate a shareable link so others can preview and import your set into their library.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <BarChart className="size-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">Score Charts</h3>
                    <p className="text-sm text-muted-foreground">
                      Track your test scores over time and watch your mastery grow with each session.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Clock className="size-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">Resume Anywhere</h3>
                    <p className="text-sm text-muted-foreground">
                      Progress syncs across all your devices. Pick up exactly where you left off.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Who It's For */}
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold mb-4">Perfect For</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <h3 className="font-semibold">🎭 Performers</h3>
                <p className="text-sm text-muted-foreground">
                  Actors, comedians, and musicians memorizing scripts, sets, and lyrics
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="font-semibold">🎤 Public Speakers</h3>
                <p className="text-sm text-muted-foreground">
                  Keynotes, toasts, commencement addresses, and TED-style talks
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="font-semibold">📚 Students</h3>
                <p className="text-sm text-muted-foreground">
                  Poems, historical passages, presentations, and academic recitation
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="font-semibold">⚖️ Professionals</h3>
                <p className="text-sm text-muted-foreground">
                  Lawyers, clergy, teachers, and anyone who needs word-perfect delivery
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA Section */}
        <Card className="border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5">
          <CardContent className="p-6 text-center">
            <h2 className="text-2xl font-bold mb-3">Ready to master your material?</h2>
            <p className="text-muted-foreground mb-6">
              Start memorizing in minutes — no credit card required.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild size="lg">
                <Link href="/create">Create Your First Set</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/onboarding">Take the Tour</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center pt-4 pb-2">
          <p className="text-sm text-muted-foreground mb-2">
            Built with ❤️ by Squared Thought
          </p>
          <div className="flex justify-center gap-4 text-xs text-muted-foreground">
            <Link href="/privacy" className="hover:text-primary transition-colors">
              Privacy Policy
            </Link>
            <span>•</span>
            <Link href="/terms" className="hover:text-primary transition-colors">
              Terms of Service
            </Link>
            <span>•</span>
            <Link href="/help" className="hover:text-primary transition-colors">
              Help & FAQ
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
