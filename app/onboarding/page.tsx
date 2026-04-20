"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { BookOpen, CheckCircle2, ArrowRight, Brain } from "lucide-react"

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [touchStart, setTouchStart] = useState(0)
  const [touchEnd, setTouchEnd] = useState(0)

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
    if (step < 2) {
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
    
    if (isLeftSwipe && step < 2) {
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
      if (e.key === 'ArrowRight' && step < 2) {
        handleContinue()
      }
      if (e.key === 'ArrowLeft' && step > 0) {
        setStep(step - 1)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [step])

  // Step 0: Introduction
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
            
            {/* Progress Indicator */}
            <div className="flex justify-center gap-2">
              <div className="size-2 rounded-full bg-primary" />
              <div className="size-2 rounded-full bg-muted" />
              <div className="size-2 rounded-full bg-muted" />
            </div>
            
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
                Memorize with structure.<br />Recall with confidence.
              </h1>
              <p className="text-base text-muted-foreground leading-relaxed">
                Verbatim guides you step-by-step to help you remember exactly what matters.
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3">
              <Button 
                size="lg" 
                className="w-full gap-2"
                onClick={handleContinue}
              >
                Continue
                <ArrowRight className="size-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="lg"
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

  // Step 1: Simple System
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
            
            {/* Progress Indicator */}
            <div className="flex justify-center gap-2">
              <div className="size-2 rounded-full bg-muted" />
              <div className="size-2 rounded-full bg-primary" />
              <div className="size-2 rounded-full bg-muted" />
            </div>
            
            {/* Visual - Step Diagram */}
            <div className="flex justify-center">
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-center gap-2">
                  <div className="flex size-12 items-center justify-center rounded-full bg-blue-500/10 border-2 border-blue-500/30">
                    <span className="text-lg font-bold text-blue-600">1</span>
                  </div>
                </div>
                <ArrowRight className="size-5 text-muted-foreground/50" />
                <div className="flex flex-col items-center gap-2">
                  <div className="flex size-12 items-center justify-center rounded-full bg-purple-500/10 border-2 border-purple-500/30">
                    <span className="text-lg font-bold text-purple-600">2</span>
                  </div>
                </div>
                <ArrowRight className="size-5 text-muted-foreground/50" />
                <div className="flex flex-col items-center gap-2">
                  <div className="flex size-12 items-center justify-center rounded-full bg-green-500/10 border-2 border-green-500/30">
                    <span className="text-lg font-bold text-green-600">3</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex flex-col gap-6 text-center">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                A simple system that works
              </h2>
              
              <div className="flex flex-col gap-4 text-left">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="size-5 text-primary shrink-0 mt-0.5" />
                  <p className="text-base text-foreground">
                    Input your material
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="size-5 text-primary shrink-0 mt-0.5" />
                  <p className="text-base text-foreground">
                    Work through guided steps
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="size-5 text-primary shrink-0 mt-0.5" />
                  <p className="text-base text-foreground">
                    Test your recall and improve
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3">
              <Button 
                size="lg" 
                className="w-full gap-2"
                onClick={handleContinue}
              >
                Continue
                <ArrowRight className="size-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="lg"
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

  // Step 2: Start Your First Memorization
  return (
    <div 
      className="flex min-h-svh flex-col bg-background"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <main className="flex flex-1 flex-col items-center justify-center p-4 pb-8">
        <div className="w-full max-w-md flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          
          {/* Progress Indicator */}
          <div className="flex justify-center gap-2">
            <div className="size-2 rounded-full bg-muted" />
            <div className="size-2 rounded-full bg-muted" />
            <div className="size-2 rounded-full bg-primary" />
          </div>
          
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
              Start your first memorization
            </h2>
            <p className="text-base text-muted-foreground leading-relaxed">
              Add your material and begin training your memory.
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
              Create Your First Memorization
            </Button>
            <Button 
              variant="ghost" 
              size="lg"
              className="w-full text-muted-foreground"
              onClick={handleGoToLibrary}
            >
              Go to Library
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
