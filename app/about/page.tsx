"use client"

import { Header } from "@/components/header"
import { Card, CardContent } from "@/components/ui/card"
import { Info, Brain, Target, Zap, Eye, Layers, BookMarked, Mic, Star, BarChart, Clock, Sparkles } from "lucide-react"
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
            Master any text with a proven system. Verbatim combines cognitive science-backed memorization techniques with modern technology to help you remember exactly what matters.
          </p>
        </div>

        {/* The Science Section */}
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="p-8">
            <div className="flex flex-col gap-6">
              <div className="flex items-start gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/20">
                  <Brain className="size-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-3">Built on Science</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Verbatim is built on decades of memory research. Our approach combines proven cognitive techniques used by memory champions with modern technology to make memorization accessible to everyone.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* The Method */}
        <div className="flex flex-col gap-4">
          <h2 className="text-2xl font-bold">The First Letter Method</h2>
          <p className="text-muted-foreground">
            At the heart of Verbatim is the first letter encoding technique — a powerful method proven to enhance recall through progressive revelation.
          </p>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col gap-4">
                <div className="bg-muted/30 p-4 rounded-lg">
                  <p className="text-sm font-medium text-muted-foreground mb-2">Original Text:</p>
                  <p className="text-base">
                    "To be or not to be, that is the question"
                  </p>
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
                  <strong className="text-foreground">How it works:</strong> Your brain sees the first letter as a retrieval cue, triggering recall of the full word. Through 3 progressive levels, we gradually reduce these cues until you can recall the entire text from memory alone.
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">Why it works:</strong> This method leverages your brain's natural pattern recognition and contextual memory, building strong neural pathways that make recall effortless.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* The 3-Step System */}
        <div className="flex flex-col gap-4">
          <h2 className="text-2xl font-bold">The 3-Step System</h2>
          
          <Card className="border-blue-500/20">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-blue-500/10">
                  <Eye className="size-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-2">Step 1: Familiarize</h3>
                  <p className="text-muted-foreground mb-3">
                    Build foundational understanding through repeated exposure. Read your content, use flashcard mode for chunk-by-chunk review, and bookmark key sections.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs px-2 py-1 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-400 font-medium">
                      Full Text View
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-400 font-medium">
                      Flashcard Mode
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-400 font-medium">
                      Bookmarking
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-purple-500/20">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-purple-500/10">
                  <Sparkles className="size-6 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-2">Step 2: Encode</h3>
                  <p className="text-muted-foreground mb-3">
                    Train your memory with the first letter method. Work through 3 progressive levels, gradually reducing cues until you achieve complete recall.
                  </p>
                  <div className="flex flex-col gap-2 mt-4">
                    <div className="flex items-center gap-2">
                      <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-purple-500/10 text-xs font-bold text-purple-600">1</div>
                      <span className="text-sm text-muted-foreground">All first letters visible</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-purple-500/10 text-xs font-bold text-purple-600">2</div>
                      <span className="text-sm text-muted-foreground">Reduced visual cues</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-purple-500/10 text-xs font-bold text-purple-600">3</div>
                      <span className="text-sm text-muted-foreground">Complete memory recall</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-500/20">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-green-500/10">
                  <Target className="size-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-2">Step 3: Test</h3>
                  <p className="text-muted-foreground mb-3">
                    Prove your mastery with multiple test modes. Choose the format that best fits your learning style and goals.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-700 dark:text-green-400 font-medium">
                      First Letter Test
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-700 dark:text-green-400 font-medium">
                      Full Typing Test
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-700 dark:text-green-400 font-medium">
                      Audio Recall
                    </span>
                  </div>
                </div>
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
                      Swipe through chunks, bookmark favorites, and filter to review only what matters.
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
                      Record yourself speaking the text and get instant AI-powered transcription and grading.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Layers className="size-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">Smart Chunking</h3>
                    <p className="text-sm text-muted-foreground">
                      Automatically split content by paragraph, sentence, line, or create custom boundaries with "/".
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
                    <h3 className="font-semibold mb-1">Progress Tracking</h3>
                    <p className="text-sm text-muted-foreground">
                      See your mastery level at a glance with detailed analytics across all steps.
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
                      Your progress syncs across devices. Pick up exactly where you left off.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Star className="size-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">Personalized Recommendations</h3>
                    <p className="text-sm text-muted-foreground">
                      Smart suggestions guide you through the optimal learning path based on your progress.
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
                  Actors, speakers, and presenters memorizing scripts and speeches
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="font-semibold">📚 Students</h3>
                <p className="text-sm text-muted-foreground">
                  Learning poems, historical documents, or presentation material
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="font-semibold">🎤 Public Speakers</h3>
                <p className="text-sm text-muted-foreground">
                  Mastering keynotes, toasts, and important addresses
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="font-semibold">⚖️ Professionals</h3>
                <p className="text-sm text-muted-foreground">
                  Lawyers, teachers, and anyone who needs word-perfect recall
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
              Join thousands using Verbatim to memorize with confidence.
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
