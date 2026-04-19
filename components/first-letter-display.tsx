"use client"

import { toFirstLetterFormat } from "@/lib/text-utils"
import { cn } from "@/lib/utils"

interface FirstLetterDisplayProps {
  text: string
  className?: string
  showFullText?: boolean
  variant?: "default" | "compact"
}

/**
 * Displays text with its first-letter memory aid format.
 * Shows the full text followed by the first-letter version for easy scanning.
 */
export function FirstLetterDisplay({ 
  text, 
  className,
  showFullText = true,
  variant = "default"
}: FirstLetterDisplayProps) {
  const firstLetters = toFirstLetterFormat(text)

  if (variant === "compact") {
    return (
      <div className={cn("flex flex-col gap-1", className)}>
        {showFullText && (
          <p className="text-sm leading-relaxed text-foreground">{text}</p>
        )}
        <p className="font-mono text-sm tracking-[0.25em] text-muted-foreground">
          {firstLetters}
        </p>
      </div>
    )
  }

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {showFullText && (
        <p className="leading-relaxed text-foreground">{text}</p>
      )}
      <div className="flex items-center gap-2">
        <span className="shrink-0 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Hint
        </span>
        <div className="h-px flex-1 bg-border" />
      </div>
      <p className="font-mono text-base tracking-[0.3em] text-muted-foreground">
        {firstLetters}
      </p>
    </div>
  )
}

interface FirstLetterPreviewProps {
  text: string
  className?: string
}

/**
 * A minimal inline preview showing just the first-letter format.
 * Useful for list views and compact displays.
 */
export function FirstLetterPreview({ text, className }: FirstLetterPreviewProps) {
  const firstLetters = toFirstLetterFormat(text)
  
  return (
    <span 
      className={cn(
        "inline-block font-mono text-xs tracking-[0.2em] text-muted-foreground",
        className
      )}
    >
      {firstLetters}
    </span>
  )
}
