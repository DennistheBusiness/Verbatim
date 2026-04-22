"use client"

import { useState } from "react"
import { Bookmark } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export interface FlashcardProps {
  chunk: {
    id: string
    orderIndex: number
    text: string
  }
  mode: "simple" | "partial"
  isMarked: boolean
  onMark: () => void
  className?: string
}

function generatePartialText(text: string): { word: string; hint: string }[] {
  const words = text.split(/\s+/).filter(w => w.length > 0)
  
  return words.map(word => {
    // Show first 2-3 characters based on word length
    const hintLength = word.length <= 3 ? 1 : word.length <= 6 ? 2 : 3
    const hint = word.substring(0, hintLength)
    return { word, hint }
  })
}

export function Flashcard({ chunk, mode, isMarked, onMark, className }: FlashcardProps) {
  const [isFlipped, setIsFlipped] = useState(false)

  const handleCardClick = () => {
    if (mode === "partial") {
      setIsFlipped(!isFlipped)
    }
  }

  const partialWords = mode === "partial" ? generatePartialText(chunk.text) : []

  return (
    <div className={cn("relative w-full", className)}>
      <Card
        className={cn(
          "relative min-h-[400px] cursor-pointer transition-all duration-300",
          mode === "partial" && "hover:shadow-lg",
          isMarked && "bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20"
        )}
        onClick={handleCardClick}
      >
        {/* Bookmark button */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onMark()
          }}
          className={cn(
            "absolute top-4 right-4 z-10 p-2 rounded-full transition-colors",
            "hover:bg-accent",
            isMarked ? "text-primary" : "text-muted-foreground"
          )}
          aria-label={isMarked ? "Unmark chunk" : "Mark chunk for review"}
        >
          <Bookmark className={cn("size-5", isMarked && "fill-current")} />
        </button>

        <CardContent className="flex items-center justify-center p-8 min-h-[400px]">
          {mode === "simple" ? (
            // Simple mode: Always show full text
            <p className="text-xl leading-relaxed text-center max-w-2xl whitespace-pre-wrap">
              {chunk.text}
            </p>
          ) : (
            // Partial mode: Show hints or full text based on flip state
            <div className="text-xl leading-relaxed text-center max-w-2xl">
              {isFlipped ? (
                <p className="whitespace-pre-wrap">{chunk.text}</p>
              ) : (
                <div className="flex flex-wrap gap-2 justify-center">
                  {partialWords.map((item, idx) => (
                    <span key={idx} className="inline-flex items-baseline gap-0.5">
                      <span className="font-medium">{item.hint}</span>
                      <span className="text-muted-foreground">
                        {"_".repeat(item.word.length - item.hint.length)}
                      </span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>

        {/* Mode indicator */}
        {mode === "partial" && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-muted-foreground">
            {isFlipped ? "Tap to hide" : "Tap to reveal full text"}
          </div>
        )}
      </Card>
    </div>
  )
}
