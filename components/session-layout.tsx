"use client"

import Image from "next/image"
import { ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { NavigationMenu } from "@/components/navigation-menu"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"
import { useEffect, useState } from "react"

interface SessionLayoutProps {
  step?: string
  title: string
  setTitle: string
  onBack: () => void
  children: React.ReactNode
  contextAction?: React.ReactNode
  primaryAction?: {
    label: string
    onClick: () => void
    icon?: React.ReactNode
  }
  secondaryAction?: {
    label: string
    onClick: () => void
    variant?: "outline" | "ghost"
  }
  showBottomActions?: boolean
}

export function SessionLayout({
  step,
  title,
  setTitle,
  onBack,
  children,
  contextAction,
  primaryAction,
  secondaryAction,
  showBottomActions = true,
}: SessionLayoutProps) {
  const hasActions = primaryAction || secondaryAction
  const [user, setUser] = useState<User | null>(null)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [supabase])

  return (
    <div className="flex min-h-svh flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        {/* Main row: back · logo · menu */}
        <div className="flex h-14 items-center px-2">
          <Button variant="ghost" size="icon-sm" onClick={onBack} className="shrink-0">
            <ChevronLeft className="size-5" />
            <span className="sr-only">Go back</span>
          </Button>

          {/* Centered logo */}
          <div className="flex flex-1 items-center justify-center gap-2">
            <Image
              src="/verbatim-logo-icon.png"
              alt="Verbatim"
              width={44}
              height={44}
              className="shrink-0"
            />
            <span className="text-base font-bold tracking-tight bg-gradient-to-r from-[oklch(0.55_0.22_240)] to-[oklch(0.65_0.20_150)] bg-clip-text text-transparent">
              Verbatim
            </span>
          </div>

          <div className="shrink-0">
            <NavigationMenu user={user} />
          </div>
        </div>

        {/* Context strip: step · title · set name */}
        <div className="border-t bg-muted/30 px-4 py-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 flex-col gap-0.5">
              {step && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-primary">{step}</span>
                  <span className="text-[11px] text-muted-foreground/60">·</span>
                  <span className="text-[11px] font-medium text-muted-foreground">{title}</span>
                </div>
              )}
              <p className="truncate text-sm font-medium leading-tight text-foreground">{setTitle}</p>
            </div>
            {contextAction && (
              <div className="shrink-0">{contextAction}</div>
            )}
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
