"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X, Lightbulb, ChevronLeft, ChevronRight } from "lucide-react"

interface Tip {
  id: string
  title: string
  content: string
  page?: "home" | "detail" | "create" | "all"
}

const TIPS: Tip[] = [
  {
    id: "first-letter",
    title: "First-Letter Technique",
    content: "The first-letter encoding practice helps your brain form memory anchors. Start by familiarizing yourself with the text, then practice with just the first letters.",
    page: "detail"
  },
  {
    id: "chunking",
    title: "Smart Chunking",
    content: "Break your text into manageable chunks (paragraphs, sentences, or lines). Smaller chunks are easier to memorize and help build confidence.",
    page: "create"
  },
  {
    id: "tags",
    title: "Organize with Tags",
    content: "Use tags to organize your memorization sets by category (e.g., 'speeches', 'poems', 'scripts'). This makes finding and practicing specific sets easier.",
    page: "home"
  },
  {
    id: "search",
    title: "Quick Search",
    content: "Use the search bar to quickly find memorization sets by title, content, or tags. Perfect for large libraries!",
    page: "home"
  },
  {
    id: "progress",
    title: "Track Your Progress",
    content: "Your practice results are automatically saved. Watch your accuracy improve over time as you practice regularly.",
    page: "detail"
  },
  {
    id: "audio",
    title: "Add Audio Recordings",
    content: "Upload or record audio to hear the correct pronunciation and rhythm. Great for speeches and performances!",
    page: "create"
  },
  {
    id: "guided-flow",
    title: "Follow the Guided Flow",
    content: "Use the 3-step guided practice: 1) Familiarize (read), 2) Encode (first letters), 3) Test (full typing). This proven sequence maximizes retention.",
    page: "detail"
  }
]

const STORAGE_KEY = "verbatim-dismissed-tips"
const CURRENT_TIP_KEY = "verbatim-current-tip"

interface OnboardingTipProps {
  page?: "home" | "detail" | "create"
  delay?: number // milliseconds before showing tip
}

export function OnboardingTip({ page = "home", delay = 2000 }: OnboardingTipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [currentTipIndex, setCurrentTipIndex] = useState(0)

  // Filter tips for current page
  const relevantTips = TIPS.filter(tip => !tip.page || tip.page === "all" || tip.page === page)

  useEffect(() => {
    // Check if user has dismissed all tips
    const dismissedTips = getDismissedTips()
    const allDismissed = relevantTips.every(tip => dismissedTips.includes(tip.id))
    
    if (allDismissed) {
      return
    }

    // Find first non-dismissed tip
    const firstNonDismissed = relevantTips.findIndex(tip => !dismissedTips.includes(tip.id))
    if (firstNonDismissed !== -1) {
      setCurrentTipIndex(firstNonDismissed)
    }

    // Load current tip index from localStorage
    const savedIndex = localStorage.getItem(CURRENT_TIP_KEY)
    if (savedIndex) {
      const index = parseInt(savedIndex, 10)
      if (index >= 0 && index < relevantTips.length) {
        setCurrentTipIndex(index)
      }
    }

    // Show tip after delay
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, delay)

    return () => clearTimeout(timer)
  }, [page, delay])

  const getDismissedTips = (): string[] => {
    try {
      const dismissed = localStorage.getItem(STORAGE_KEY)
      return dismissed ? JSON.parse(dismissed) : []
    } catch {
      return []
    }
  }

  const saveDismissedTip = (tipId: string) => {
    try {
      const dismissed = getDismissedTips()
      if (!dismissed.includes(tipId)) {
        dismissed.push(tipId)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dismissed))
      }
    } catch (error) {
      console.error("Failed to save dismissed tip:", error)
    }
  }

  const handleDismiss = () => {
    const currentTip = relevantTips[currentTipIndex]
    if (currentTip) {
      saveDismissedTip(currentTip.id)
    }
    setIsVisible(false)
  }

  const handleDismissAll = () => {
    try {
      const allTipIds = TIPS.map(tip => tip.id)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(allTipIds))
      setIsVisible(false)
    } catch (error) {
      console.error("Failed to dismiss all tips:", error)
    }
  }

  const handleNext = () => {
    const nextIndex = currentTipIndex + 1
    if (nextIndex < relevantTips.length) {
      setCurrentTipIndex(nextIndex)
      localStorage.setItem(CURRENT_TIP_KEY, nextIndex.toString())
    }
  }

  const handlePrevious = () => {
    const prevIndex = currentTipIndex - 1
    if (prevIndex >= 0) {
      setCurrentTipIndex(prevIndex)
      localStorage.setItem(CURRENT_TIP_KEY, prevIndex.toString())
    }
  }

  if (!isVisible || relevantTips.length === 0) {
    return null
  }

  const currentTip = relevantTips[currentTipIndex]
  const dismissedTips = getDismissedTips()
  
  // Don't show if already dismissed
  if (currentTip && dismissedTips.includes(currentTip.id)) {
    return null
  }

  return (
    <Card className="fixed bottom-4 right-4 w-full max-w-sm shadow-lg z-50 animate-in slide-in-from-bottom-2">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            <h3 className="font-semibold text-sm">{currentTip?.title}</h3>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 -mt-1 -mr-2"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        <p className="text-sm text-muted-foreground">{currentTip?.content}</p>
      </CardContent>
      <CardFooter className="flex items-center justify-between pt-0">
        <div className="flex gap-1">
          {relevantTips.map((_, index) => (
            <div
              key={index}
              className={`h-1.5 w-1.5 rounded-full ${
                index === currentTipIndex ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePrevious}
            disabled={currentTipIndex === 0}
            className="h-8 px-2"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleNext}
            disabled={currentTipIndex === relevantTips.length - 1}
            className="h-8 px-2"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismissAll}
            className="h-8 text-xs"
          >
            Don't show again
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
