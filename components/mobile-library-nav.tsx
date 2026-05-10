"use client"

import Link from "next/link"
import { Plus, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"

export function MobileLibraryNav() {
  return (
    <div
      className="fixed bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden z-50"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex flex-col items-center gap-2 p-4">
        <Button asChild size="lg" className="w-full max-w-xs gap-2 rounded-full shadow-lg">
          <Link href="/create">
            <Plus className="size-5" />
            New Memorization
          </Link>
        </Button>
        <Button asChild size="lg" variant="outline" className="w-full max-w-xs gap-2 rounded-full">
          <Link href="/analytics">
            <BarChart3 className="size-5" />
            View Analytics
          </Link>
        </Button>
      </div>
    </div>
  )
}
