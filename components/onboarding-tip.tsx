"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Lightbulb, ChevronLeft, ChevronRight } from "lucide-react"

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
  delay?: number
}

export function OnboardingTip({ page = "home", delay = 2000 }: OnboardingTipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [currentTipIndex, setCurrentTipIndex] = useState(0)

  const relevantTips = TIPS.filter(tip => !tip.page || tip.page === "all" || tip.page === page)

  useEffect(() => {
    const dismissedTips = getDismissedTips()
    const allDismissed = relevantTips.every(tip => dismissedTips.includes(tip.id))

    if (allDismissed) return

    const firstNonDismissed = relevantTips.findIndex(tip => !dismissedTips.includes(tip.id))
    if (firstNonDismissed !== -1) {
      setCurrentTipIndex(firstNonDismissed)
    }

    const savedIndex = localStorage.getItem(CURRENT_TIP_KEY)
    if (savedIndex) {
      const index = parseInt(savedIndex, 10)
      if (index >= 0 && index < relevantTips.length) {
        setCurrentTipIndex(index)
      }
    }

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
    if (currentTip) saveDismissedTip(currentTip.id)
    setIsVisible(false)
  }

  const handleDismissAll = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(TIPS.map(tip => tip.id)))
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

  if (relevantTips.length === 0) return null

  const currentTip = relevantTips[currentTipIndex]
  const dismissedTips = getDismissedTips()
  if (currentTip && dismissedTips.includes(currentTip.id)) return null

  return (
    <Dialog open={isVisible} onOpenChange={(open) => { if (!open) handleDismiss() }}>
      <DialogContent className="max-w-sm gap-0 p-0">
        <DialogHeader className="p-5 pb-3">
          <div className="flex items-center gap-2">
            <Lightbulb className="size-5 text-yellow-500 shrink-0" />
            <DialogTitle className="text-base">{currentTip?.title}</DialogTitle>
          </div>
        </DialogHeader>

        <div className="px-5 pb-4">
          <p className="text-sm text-muted-foreground leading-relaxed">{currentTip?.content}</p>
        </div>

        <div className="flex items-center justify-between border-t px-5 py-3">
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
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePrevious}
              disabled={currentTipIndex === 0}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNext}
              disabled={currentTipIndex === relevantTips.length - 1}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismissAll}
              className="h-8 text-xs text-muted-foreground"
            >
              Don't show again
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
