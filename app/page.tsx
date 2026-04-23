"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Plus, BookOpen, Layers, Calendar, Pencil, Search, X, Edit3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty"
import { Spinner } from "@/components/ui/spinner"
import { Header } from "@/components/header"
import { SplashScreen } from "@/components/splash-screen"
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

function calculateProgress(set: any): number {
  let completed = 0
  let total = 6 // familiarize (1) + encode stages (3) + tests (2)
  
  if (set.progress.familiarizeCompleted) completed++
  if (set.progress.encode.stage1Completed) completed++
  if (set.progress.encode.stage2Completed) completed++
  if (set.progress.encode.stage3Completed) completed++
  if (set.progress.tests.firstLetter.bestScore !== null) completed++
  if (set.progress.tests.fullText.bestScore !== null) completed++
  
  return Math.round((completed / total) * 100)
}

export default function HomePage() {
  const { sets, isLoaded, getAllTags } = useMemorization()
  const [showSplash, setShowSplash] = useState(true)
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  // Get all available tags
  const allTags = useMemo(() => getAllTags(), [getAllTags])

  // Filter sets based on search query and selected tags
  const filteredSets = useMemo(() => {
    let filtered = sets

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((set) =>
        set.title.toLowerCase().includes(query) ||
        set.content.toLowerCase().includes(query)
      )
    }

    // Filter by selected tags
    if (selectedTags.length > 0) {
      filtered = filtered.filter((set) =>
        selectedTags.every((tag) => set.tags.includes(tag))
      )
    }

    return filtered
  }, [sets, searchQuery, selectedTags])

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag)
        ? prev.filter((t) => t !== tag)
        : [...prev, tag]
    )
  }

  const clearFilters = () => {
    setSearchQuery("")
    setSelectedTags([])
  }

  // Check if user has seen splash this session
  useEffect(() => {
    const hasSeenSplash = sessionStorage.getItem("verbatim-splash-seen")
    if (hasSeenSplash) {
      setShowSplash(false)
    }
  }, [])

  const handleSplashComplete = () => {
    sessionStorage.setItem("verbatim-splash-seen", "true")
    setShowSplash(false)
    
    // Check if first-time user
    const hasSeenOnboarding = localStorage.getItem("hasSeenOnboarding")
    if (!hasSeenOnboarding) {
      setIsCheckingOnboarding(true)
      // Navigate to onboarding for first-time users
      window.location.href = "/onboarding"
    }
  }

  // Show splash screen on first visit
  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} duration={2000} />
  }

  // Show loading while checking/navigating to onboarding
  if (isCheckingOnboarding) {
    return (
      <div className="flex min-h-svh flex-col bg-background">
        <main className="flex flex-1 flex-col items-center justify-center gap-3">
          <Spinner size="lg" />
        </main>
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className="flex min-h-svh flex-col bg-background">
        <Header title="Library" showBranding={true} />
        <main className="flex flex-1 flex-col items-center justify-center gap-3">
          <Spinner size="lg" />
          <p className="text-sm text-muted-foreground">Loading your library...</p>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <Header title="Library" showBranding={true} />
      
      <main className="flex flex-1 flex-col gap-6 p-4 pb-8">
        {sets.length === 0 ? (
          <Empty className="flex-1 border-0 bg-muted/30">
            <EmptyHeader>
              <EmptyMedia variant="icon" className="size-14 rounded-full bg-primary/10 text-primary [&_svg]:size-7">
                <BookOpen />
              </EmptyMedia>
              <EmptyTitle className="text-xl">Create your first memorization</EmptyTitle>
              <EmptyDescription className="text-base">
                Add text and start building recall using Verbatim's system.
              </EmptyDescription>
              <p className="text-sm text-muted-foreground/80 mt-2">
                Works best with speeches, scripts, or structured content
              </p>
            </EmptyHeader>
            <EmptyContent>
              <Button asChild size="lg" className="w-full max-w-xs gap-2">
                <Link href="/create">
                  <Plus className="size-5" />
                  New Memorization
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

            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search memorizations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>

            {/* Tag Filters */}
            {allTags.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">Filter by tag:</span>
                {allTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant={selectedTags.includes(tag) ? "default" : "outline"}
                    className="cursor-pointer transition-colors"
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                  </Badge>
                ))}
                {(searchQuery || selectedTags.length > 0) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="h-7 gap-1 text-xs"
                  >
                    <X className="size-3" />
                    Clear filters
                  </Button>
                )}
              </div>
            )}

            {/* Sets list */}
            {filteredSets.length === 0 ? (
              <Empty className="flex-1 border bg-muted/30">
                <EmptyHeader>
                  <EmptyMedia variant="icon" className="size-12 rounded-full bg-muted text-muted-foreground [&_svg]:size-5">
                    <Search />
                  </EmptyMedia>
                  <EmptyTitle>No memorizations found</EmptyTitle>
                  <EmptyDescription>
                    {searchQuery || selectedTags.length > 0
                      ? "Try adjusting your search or filters"
                      : "No memorizations match your criteria"}
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <Button onClick={clearFilters} variant="outline">
                    Clear filters
                  </Button>
                </EmptyContent>
              </Empty>
            ) : (
              <div className="flex flex-col gap-3">
                {filteredSets.map((set) => {
                  const progressPercentage = calculateProgress(set)
                  
                  return (
                    <Card key={set.id} className="group relative transition-colors hover:bg-accent/50">
                      <CardContent 
                        className="flex flex-col gap-3 py-4 cursor-pointer"
                        onClick={() => router.push(`/memorization/${set.id}`)}
                      >
                          {/* Progress bar at top */}
                          <div className="flex items-center gap-3">
                            <Progress 
                              value={progressPercentage} 
                              className="h-1.5 flex-1"
                            />
                            <span className="shrink-0 text-xs font-medium tabular-nums text-muted-foreground">
                              {progressPercentage}%
                            </span>
                          </div>
                          
                          {/* Title and date row */}
                          <div className="flex items-start justify-between gap-3">
                            <h3 className="font-semibold leading-snug text-foreground">
                              {set.title}
                            </h3>
                            <div className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
                              <Calendar className="size-3" />
                              <span className="hidden sm:inline">{formatDate(set.updatedAt || set.createdAt)}</span>
                              <span className="sm:hidden">{formatDate(set.updatedAt || set.createdAt).split(' ')[0]}</span>
                            </div>
                          </div>
                          
                          {/* Content preview */}
                          <p className="text-sm leading-relaxed text-muted-foreground line-clamp-2">
                            {truncateContent(set.content)}
                          </p>
                          
                          {/* Metadata and Edit button row */}
                          <div className="flex items-center justify-between gap-3 pt-1">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Layers className="size-3.5" />
                                <span className="tabular-nums">
                                  {set.chunks.length}
                                </span>
                              </div>
                              <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground capitalize">
                                {set.chunkMode}
                              </span>
                            </div>
                            
                            {/* Mobile-visible edit button */}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="shrink-0 gap-1.5 h-8 -mr-2 opacity-60 hover:opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                              asChild
                            >
                              <Link 
                                href={`/edit/${set.id}`}
                                onClick={(e: React.MouseEvent) => {
                                  e.stopPropagation()
                                }}
                              >
                                <Edit3 className="size-3.5" />
                                <span className="text-xs">Edit</span>
                              </Link>
                            </Button>
                          </div>

                          {/* Tags */}
                          {set.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {set.tags.map((tag) => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </CardContent>

                    </Card>
                  )
                })}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
