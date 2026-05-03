"use client"

import Link from "next/link"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

export function MobileLibraryNav() {
  return (
    <div
      className="fixed bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden z-50"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-center justify-center p-4">
        <Button asChild size="lg" className="w-full max-w-xs gap-2 rounded-full shadow-lg">
          <Link href="/create">
            <Plus className="size-5" />
            New Memorization
          </Link>
        </Button>
      </div>
    </div>
  )
}
