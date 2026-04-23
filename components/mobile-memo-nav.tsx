"use client"

import React from "react"
import Link from "next/link"
import { BookOpen, Layers, Target, Edit3 } from "lucide-react"
import { cn } from "@/lib/utils"

interface MobileMemoNavProps {
  memoId: string
  onFamiliarize: () => void
  onEncode: () => void
  onTest: () => void
  currentStep?: "familiarize" | "encode" | "test" | null
}

export function MobileMemoNav({ 
  memoId, 
  onFamiliarize, 
  onEncode, 
  onTest,
  currentStep 
}: MobileMemoNavProps) {
  const handleClick = (action: () => void) => (e: React.MouseEvent<HTMLButtonElement>) => {
    action()
    e.currentTarget.blur()
  }

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden z-50"
      style={{ WebkitTapHighlightColor: 'transparent' } as React.CSSProperties}
    >
      <div className="grid grid-cols-4 gap-1 p-2">
        <button
          onClick={handleClick(onFamiliarize)}
          style={{ WebkitTapHighlightColor: 'transparent' } as React.CSSProperties}
          className={cn(
            "flex flex-col items-center justify-center gap-1 rounded-lg p-3 transition-all active:scale-95 touch-manipulation focus:outline-none",
            currentStep === "familiarize" 
              ? "bg-primary text-primary-foreground" 
              : "active:bg-muted"
          )}
        >
          <BookOpen className="size-5" />
          <span className="text-[10px] font-medium">Familiarize</span>
        </button>

        <button
          onClick={handleClick(onEncode)}
          style={{ WebkitTapHighlightColor: 'transparent' } as React.CSSProperties}
          className={cn(
            "flex flex-col items-center justify-center gap-1 rounded-lg p-3 transition-all active:scale-95 touch-manipulation focus:outline-none",
            currentStep === "encode" 
              ? "bg-primary text-primary-foreground" 
              : "active:bg-muted"
          )}
        >
          <Layers className="size-5" />
          <span className="text-[10px] font-medium">Encode</span>
        </button>

        <button
          onClick={handleClick(onTest)}
          style={{ WebkitTapHighlightColor: 'transparent' } as React.CSSProperties}
          className={cn(
            "flex flex-col items-center justify-center gap-1 rounded-lg p-3 transition-all active:scale-95 touch-manipulation focus:outline-none",
            currentStep === "test" 
              ? "bg-primary text-primary-foreground" 
              : "active:bg-muted"
          )}
        >
          <Target className="size-5" />
          <span className="text-[10px] font-medium">Test</span>
        </button>

        <Link
          href={`/edit/${memoId}`}
          style={{ WebkitTapHighlightColor: 'transparent' } as React.CSSProperties}
          className="flex flex-col items-center justify-center gap-1 rounded-lg p-3 transition-all active:scale-95 active:bg-muted touch-manipulation focus:outline-none"
        >
          <Edit3 className="size-5" />
          <span className="text-[10px] font-medium">Edit</span>
        </Link>
      </div>
    </div>
  )
}
