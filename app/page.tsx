"use client"

import Link from "next/link"
import { Plus, BookOpen, Layers, Calendar, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty"
import { Spinner } from "@/components/ui/spinner"
import { Header } from "@/components/header"
import { useMemorization } from "@/lib/memorization-context"

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return "Today"
  if (diffDays === 1) return "Yesterday"
  if (diffDays < 7) return `${diffDays} days ago`
  
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  })
}

function truncateContent(content: string, maxLength: number = 100): string {
  if (content.length <= maxLength) return content
  return content.slice(0, maxLength).trim() + "..."
}

export default function HomePage() {
  const { sets, isLoaded } = useMemorization()

  if (!isLoaded) {
    return (
      <div className="flex min-h-svh flex-col bg-background">
        <Header title="Library" />
        <main className="flex flex-1 flex-col items-center justify-center gap-3">
          <Spinner size="lg" />
          <p className="text-sm text-muted-foreground">Loading your library...</p>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <Header title="Library" />
      
      <main className="flex flex-1 flex-col gap-6 p-4 pb-8">
        {sets.length === 0 ? (
          <Empty className="flex-1 border-0 bg-muted/30">
            <EmptyHeader>
              <EmptyMedia variant="icon" className="size-14 rounded-full bg-primary/10 text-primary [&_svg]:size-7">
                <BookOpen />
              </EmptyMedia>
              <EmptyTitle className="text-xl">No memorization sets yet</EmptyTitle>
              <EmptyDescription className="text-base">
                Build your memory with structured practice. Create your first set to start encoding information into long-term recall.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button asChild size="lg" className="w-full max-w-xs gap-2">
                <Link href="/create">
                  <Plus className="size-5" />
                  Create New Memorization
                </Link>
              </Button>
            </EmptyContent>
          </Empty>
        ) : (
          <>
            {/* Header with count and create button */}
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-0.5">
                <span className="text-2xl font-semibold tabular-nums">{sets.length}</span>
                <span className="text-sm text-muted-foreground">
                  {sets.length === 1 ? "Memorization Set" : "Memorization Sets"}
                </span>
              </div>
              <Button asChild className="gap-2">
                <Link href="/create">
                  <Plus className="size-4" />
                  New Memorization
                </Link>
              </Button>
            </div>
            
            {/* Sets list */}
            <div className="flex flex-col gap-3">
              {sets.map((set) => (
                <div key={set.id} className="group relative">
                  <Link href={`/memorization/${set.id}`} className="block">
                    <Card className="transition-colors hover:bg-accent/50">
                      <CardContent className="flex flex-col gap-3 py-4">
                        {/* Title and date row */}
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="font-semibold leading-snug text-foreground pr-8">
                            {set.title}
                          </h3>
                          <div className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
                            <Calendar className="size-3" />
                            <span>{formatDate(set.updatedAt || set.createdAt)}</span>
                          </div>
                        </div>
                        
                        {/* Content preview */}
                        <p className="text-sm leading-relaxed text-muted-foreground line-clamp-2">
                          {truncateContent(set.content)}
                        </p>
                        
                        {/* Metadata row */}
                        <div className="flex items-center gap-4 pt-1">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Layers className="size-3.5" />
                            <span>
                              {set.chunks.length} {set.chunks.length === 1 ? "chunk" : "chunks"}
                            </span>
                          </div>
                          <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground capitalize">
                            {set.chunkMode}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                  {/* Edit button - positioned absolutely */}
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    asChild
                    className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e: React.MouseEvent) => e.stopPropagation()}
                  >
                    <Link href={`/edit/${set.id}`}>
                      <Pencil className="size-4" />
                      <span className="sr-only">Edit {set.title}</span>
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
