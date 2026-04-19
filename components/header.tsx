"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

interface HeaderProps {
  title: string
  showBack?: boolean
  onBack?: () => void
}

export function Header({ title, showBack = false, onBack }: HeaderProps) {
  const pathname = usePathname()
  const isHome = pathname === "/"

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
        <h1 className="text-lg font-semibold truncate">{title}</h1>
      </div>
    </header>
  )
}
