"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { BookOpen, CheckCircle2, ArrowRight, Brain, Lightbulb, Zap, Layers, BookMarked, Mic, Star, Eye, Target } from "lucide-react"

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [touchStart, setTouchStart] = useState(0)
  const [touchEnd, setTouchEnd] = useState(0)

  const totalSteps = 4 // 0-4 = 5 screens

  const handleComplete = () => {
    // Set the flag so onboarding won't show again
    localStorage.setItem("hasSeenOnboarding", "true")
    
    // Navigate to library
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

  const handleCreateFirst = () => {
    localStorage.setItem("hasSeenOnboarding", "true")
    router.push("/create")
  }

  const handleGoToLibrary = () => {
    handleComplete()
  }

  // Swipe gesture handlers
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
      setStep(step - 1)
    }
    
    // Reset
    setTouchStart(0)
    setTouchEnd(0)
  }

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' && step < totalSteps) {
        handleContinue()
      }
      if (e.key === 'ArrowLeft' && step > 0) {
        setStep(step - 1)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [step])

  // Progress indicator component
  const ProgressDots = () => (
    <div className="flex justify-center gap-2">
      {[...Array(totalSteps + 1)].map((_, i) => (
        <div 
          key={i}
          className={`size-2 rounded-full transition-all ${
            i === step ? 'bg-primary w-6' : 'bg-muted'
          }`}
        />
      ))}
    </div>
  )

  // Step 0: Welcome
  if (step === 0) {
    return (
      <div 
        className="flex min-h-svh flex-col bg-background"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <main className="flex flex-1 flex-col items-center justify-center p-4 pb-8">
          <div className="w-full max-w-md flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            
            <ProgressDots />
            
            {/* Visual */}
            <div className="flex justify-center">
              <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 animate-pulse rounded-full bg-gradient-to-r from-blue-500/20 to-green-500/20 blur-2xl" />
                <div className="relative flex size-32 items-center justify-center rounded-full bg-gradient-to-br from-blue-500/10 to-green-500/10 border-2 border-primary/20">
                  <Brain className="size-16 text-primary" strokeWidth={1.5} />
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex flex-col gap-3 text-center">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight leading-tight">
                Welcome to Verbatim
              </h1>
              <p className="text-base text-muted-foreground leading-relaxed">
                Master any text with a proven 3-step memorization system designed to make recall effortless.
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3">
              <Button 
                size="lg" 
                className="w-full gap-2"
                onClick={handleContinue}
              >
                Show Me How
                <ArrowRight className="size-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="lg"
                className="w-full text-muted-foreground"
                onClick={handleSkip}
              >
                Skip Introduction
              </Button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // Step 1: The 3-Step System
  if (step === 1) {
    return (
      <div 
        className="flex min-h-svh flex-col bg-background"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <main className="flex flex-1 flex-col items-center justify-center p-4 pb-8">
          <div className="w-full max-w-md flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            
            <ProgressDots />
            
            {/* Visual - Step Diagram */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-blue-500/10 border-2 border-blue-500/30">
                  <Eye className="size-6 text-blue-600" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-semibold text-foreground">Step 1: Familiarize</h3>
                  <p className="text-sm text-muted-foreground">Read & understand your material</p>
                </div>
              </div>
              
              <div className="pl-6 border-l-2 border-muted h-4" />
              
              <div className="flex items-center gap-3">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-purple-500/10 border-2 border-purple-500/30">
                  <Brain className="size-6 text-purple-600" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-semibold text-foreground">Step 2: Encode</h3>
                  <p className="text-sm text-muted-foreground">Build memory with the first letter method</p>
                </div>
              </div>
              
              <div className="pl-6 border-l-2 border-muted h-4" />
              
              <div className="flex items-center gap-3">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-green-500/10 border-2 border-green-500/30">
                  <Target className="size-6 text-green-600" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-semibold text-foreground">Step 3: Test</h3>
                  <p className="text-sm text-muted-foreground">Prove your recall with multiple test modes</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex flex-col gap-3 text-center">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Three simple steps to mastery
              </h2>
              <p className="text-base text-muted-foreground leading-relaxed">
                Each step builds on the last, training your brain to remember exactly what you need.
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3">
              <Button 
                size="lg" 
                className="w-full gap-2"
                onClick={handleContinue}
              >
                Learn the Method
                <ArrowRight className="size-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                className="w-full text-muted-foreground"
                onClick={handleSkip}
              >
                Skip
              </Button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // Step 2: The First Letter Method
  if (step === 2) {
    return (
      <div 
        className="flex min-h-svh flex-col bg-background"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <main className="flex flex-1 flex-col items-center justify-center p-4 pb-8">
          <div className="w-full max-w-md flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            
            <ProgressDots />
            
            {/* Visual Example */}
            <div className="flex flex-col gap-4 p-4 bg-muted/30 rounded-xl border">
              <div className="flex items-start gap-2">
                <Lightbulb className="size-5 text-amber-500 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground mb-2">Original Text:</p>
                  <p className="text-sm text-muted-foreground">
                    "To be or not to be, that is the question"
                  </p>
                </div>
              </div>
              
              <div className="h-px bg-border" />
              
              <div className="flex items-start gap-2">
                <Zap className="size-5 text-blue-500 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground mb-2">First Letters:</p>
                  <div className="font-mono text-lg tracking-wider text-primary">
                    T b o n t b, t i t q
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex flex-col gap-3 text-center">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                The First Letter Method
              </h2>
              <p className="text-base text-muted-foreground leading-relaxed">
                Start by seeing first letters, then gradually reveal less until you can recall the entire text from memory. It's like training wheels for your brain.
              </p>
            </div>
            
            {/* Key Points */}
            <div className="flex flex-col gap-3 text-left bg-primary/5 p-4 rounded-lg border border-primary/10">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="size-4 text-primary shrink-0 mt-1" />
                <p className="text-sm text-foreground">
                  <strong>3 progressive levels</strong> — Build confidence gradually
                </p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="size-4 text-primary shrink-0 mt-1" />
                <p className="text-sm text-foreground">
                  <strong>Chunk-by-chunk</strong> — Master one piece at a time
                </p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="size-4 text-primary shrink-0 mt-1" />
                <p className="text-sm text-foreground">
                  <strong>Proven technique</strong> — Used by memory champions
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3">
              <Button 
                size="lg" 
                className="w-full gap-2"
                onClick={handleContinue}
              >
                See Features
                <ArrowRight className="size-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                className="w-full text-muted-foreground"
                onClick={handleSkip}
              >
                Skip
              </Button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // Step 3: Key Features
  if (step === 3) {
    return (
      <div 
        className="flex min-h-svh flex-col bg-background"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <main className="flex flex-1 flex-col items-center justify-center p-4 pb-8">
          <div className="w-full max-w-md flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            
            <ProgressDots />

            {/* Content */}
            <div className="flex flex-col gap-3 text-center">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Everything you need to succeed
              </h2>
              <p className="text-base text-muted-foreground leading-relaxed">
                Powerful features designed to make memorization effortless.
              </p>
            </div>
            
            {/* Features Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2 p-4 bg-muted/30 rounded-lg border">
                <div className="flex size-10 items-center justify-center rounded-full bg-blue-500/10">
                  <BookMarked className="size-5 text-blue-600" />
                </div>
                <h3 className="font-semibold text-sm">Flashcard Mode</h3>
                <p className="text-xs text-muted-foreground">
                  Swipe through chunks, bookmark favorites
                </p>
              </div>
              
              <div className="flex flex-col gap-2 p-4 bg-muted/30 rounded-lg border">
                <div className="flex size-10 items-center justify-center rounded-full bg-purple-500/10">
                  <Mic className="size-5 text-purple-600" />
                </div>
                <h3 className="font-semibold text-sm">Audio Recall</h3>
                <p className="text-xs text-muted-foreground">
                  Record yourself, get instant feedback
                </p>
              </div>
              
              <div className="flex flex-col gap-2 p-4 bg-muted/30 rounded-lg border">
                <div className="flex size-10 items-center justify-center rounded-full bg-green-500/10">
                  <Layers className="size-5 text-green-600" />
                </div>
                <h3 className="font-semibold text-sm">Smart Chunking</h3>
                <p className="text-xs text-muted-foreground">
                  Auto-split by paragraph, sentence, or custom
                </p>
              </div>
              
              <div className="flex flex-col gap-2 p-4 bg-muted/30 rounded-lg border">
                <div className="flex size-10 items-center justify-center rounded-full bg-amber-500/10">
                  <Star className="size-5 text-amber-600" />
                </div>
                <h3 className="font-semibold text-sm">Progress Tracking</h3>
                <p className="text-xs text-muted-foreground">
                  See your mastery level at a glance
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3">
              <Button 
                size="lg" 
                className="w-full gap-2"
                onClick={handleContinue}
              >
                Get Started
                <ArrowRight className="size-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                className="w-full text-muted-foreground"
                onClick={handleSkip}
              >
                Skip
              </Button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // Step 4: Final - Get Started
  return (
    <div 
      className="flex min-h-svh flex-col bg-background"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <main className="flex flex-1 flex-col items-center justify-center p-4 pb-8">
        <div className="w-full max-w-md flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          
          <ProgressDots />
          
          {/* Visual */}
          <div className="flex justify-center">
            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 animate-pulse rounded-full bg-gradient-to-r from-blue-500/20 to-green-500/20 blur-2xl" />
              <div className="relative flex size-32 items-center justify-center rounded-full bg-gradient-to-br from-blue-500/10 to-green-500/10 border-2 border-primary/20">
                <BookOpen className="size-16 text-primary" strokeWidth={1.5} />
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex flex-col gap-3 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Ready to start memorizing?
            </h2>
            <p className="text-base text-muted-foreground leading-relaxed">
              Create your first memorization set and experience the power of structured learning.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <Button 
              size="lg" 
              className="w-full gap-2 brand-gradient-bg hover:opacity-90 transition-opacity"
              onClick={handleCreateFirst}
            >
              <CheckCircle2 className="size-5" />
              Create Your First Set
            </Button>
            <Button 
              variant="ghost" 
              size="lg"
              className="w-full text-muted-foreground"
              onClick={handleGoToLibrary}
            >
              Browse Library
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
