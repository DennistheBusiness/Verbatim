"use client"

import { ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

interface SessionLayoutProps {
  /** Step indicator, e.g., "Step 1" */
  step?: string
  /** Screen title, e.g., "Familiarize" */
  title: string
  /** Memorization set title */
  setTitle: string
  /** Called when back button is clicked */
  onBack: () => void
  /** Main content */
  children: React.ReactNode
  /** Primary action button */
  primaryAction?: {
    label: string
    onClick: () => void
    icon?: React.ReactNode
  }
  /** Secondary action button */
  secondaryAction?: {
    label: string
    onClick: () => void
    variant?: "outline" | "ghost"
  }
  /** Whether to show fixed bottom actions */
  showBottomActions?: boolean
}

export function SessionLayout({
  step,
  title,
  setTitle,
  onBack,
  children,
  primaryAction,
  secondaryAction,
  showBottomActions = true,
}: SessionLayoutProps) {
  const hasActions = primaryAction || secondaryAction

  return (
    <div className="flex min-h-svh flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex flex-col">
          {/* Top row with back and step */}
          <div className="flex h-14 items-center gap-3 px-4">
            <Button variant="ghost" size="icon-sm" onClick={onBack}>
              <ChevronLeft className="size-5" />
              <span className="sr-only">Go back</span>
            </Button>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              {step && (
                <span className="text-xs font-medium text-primary">{step}</span>
              )}
              <span className="truncate font-semibold leading-tight">{title}</span>
            </div>
          </div>
          {/* Memorization title row */}
          <div className="border-t bg-muted/30 px-4 py-2">
            <p className="text-sm text-muted-foreground line-clamp-1">{setTitle}</p>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className={`flex flex-1 flex-col gap-6 p-4 ${showBottomActions && hasActions ? "pb-32" : "pb-8"}`}>
        {children}
      </main>

      {/* Fixed Bottom Actions */}
      {showBottomActions && hasActions && (
        <div className="fixed inset-x-0 bottom-0 z-10 border-t bg-background/95 p-4 pb-safe backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <div className="mx-auto flex max-w-2xl flex-col gap-2">
            {primaryAction && (
              <Button size="lg" onClick={primaryAction.onClick} className="w-full gap-2">
                {primaryAction.label}
                {primaryAction.icon}
              </Button>
            )}
            {secondaryAction && (
              <Button 
                size="lg" 
                variant={secondaryAction.variant || "ghost"} 
                onClick={secondaryAction.onClick} 
                className="w-full"
              >
                {secondaryAction.label}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
