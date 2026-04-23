"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { ChevronLeft, ShieldAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { NavigationMenu } from "@/components/navigation-menu"
import { type ReactNode, useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"
import { getImpersonationState } from "@/lib/impersonation"

interface HeaderProps {
  title: string
  showBack?: boolean
  onBack?: () => void
  action?: ReactNode
  showBranding?: boolean
}

export function Header({ title, showBack = false, onBack, action, showBranding = false }: HeaderProps) {
  const pathname = usePathname()
  const isHome = pathname === "/"
  const [user, setUser] = useState<User | null>(null)
  const supabase = createClient()

  useEffect(() => {
    // Get initial user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  return (
    <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center gap-4 px-4">
        {showBack && !isHome && (
          onBack ? (
            <Button variant="ghost" size="icon-sm" onClick={onBack}>
              <ChevronLeft className="size-5" />
              <span className="sr-only">Go back</span>
            </Button>
          ) : (
            <Button variant="ghost" size="icon-sm" asChild>
              <Link href="/">
                <ChevronLeft className="size-5" />
                <span className="sr-only">Back to Library</span>
              </Link>
            </Button>
          )
        )}
        
        {showBranding ? (
          <div className="flex items-center gap-2 flex-1">
            <Image 
              src="/verbatim-logo-icon.png" 
              alt="Verbatim" 
              width={32} 
              height={32}
              className="shrink-0"
            />
            <div className="flex flex-col">
              <h1 className="text-lg font-bold tracking-tight leading-none bg-gradient-to-r from-[oklch(0.55_0.22_240)] to-[oklch(0.65_0.20_150)] bg-clip-text text-transparent">
                Verbatim
              </h1>
              <span className="text-[10px] text-muted-foreground leading-none">
                by Squared Thought
              </span>
            </div>
          </div>
        ) : (
          <h1 className="text-lg font-semibold truncate flex-1">{title}</h1>
        )}
        
        {action && (
          <div className="shrink-0">
            {action}
          </div>
        )}
        
        {/* Navigation Menu */}
        <div className="shrink-0">
          <NavigationMenu user={user} />
        </div>
      </div>
    </header>
  )
}
