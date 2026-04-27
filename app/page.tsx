"use client"

import { useState, useEffect, useMemo, memo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Plus, BookOpen, Search, X, Edit3, HelpCircle, CalendarClock,
  Clock, Check, Sparkles, Target, Mic, ChevronRight, Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty"
import { Spinner } from "@/components/ui/spinner"
import { Header } from "@/components/header"
import { SplashScreen } from "@/components/splash-screen"
import { MobileLibraryNav } from "@/components/mobile-library-nav"
import { LibrarySkeletons } from "@/components/loading-skeletons"
import { TodaysPracticeBanner } from "@/components/todays-practice-banner"
import { useSetList, countWords, type MemorizationSet, type RecommendedStep } from "@/lib/memorization-context"
import { trackEvent } from "@/lib/analytics"
import * as AnalyticsEvents from "@/lib/analytics-events"
import { cn } from "@/lib/utils"

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return "Today"
  if (diffDays === 1) return "Yesterday"
  if (diffDays < 7) return `${diffDays}d ago`

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  })
}

// ─── Step-track helpers ────────────────────────────────────────────────────

type StepState = "complete" | "active" | "upcoming"

function getStepStates(set: MemorizationSet): [StepState, StepState, StepState] {
  const { familiarizeCompleted, encode, tests } = set.progress
  const encodeStages = [encode.stage1Completed, encode.stage2Completed, encode.stage3Completed]
  const encodeCount = encodeStages.filter(Boolean).length
  const hasTest =
    tests.firstLetter.lastScore !== null ||
    tests.fullText.lastScore !== null ||
    tests.audioTest.lastScore !== null

  const readState: StepState = familiarizeCompleted ? "complete" : set.recommendedStep === "familiarize" ? "active" : "upcoming"
  const encodeState: StepState = encodeCount === 3 ? "complete" : encodeCount > 0 || set.recommendedStep === "encode" ? "active" : "upcoming"
  const testState: StepState = hasTest ? "complete" : set.recommendedStep === "test" ? "active" : "upcoming"

  return [readState, encodeState, testState]
}

function getBestTestScore(set: MemorizationSet): number | null {
  const scores = [
    set.progress.tests.firstLetter.bestScore,
    set.progress.tests.fullText.bestScore,
    set.progress.tests.audioTest.bestScore,
  ].filter((s): s is number => s !== null)
  return scores.length > 0 ? Math.max(...scores) : null
}

// ─── Sub-components ────────────────────────────────────────────────────────

const STEP_META = [
  { key: "familiarize" as RecommendedStep, label: "Read",  Icon: BookOpen,  dot: "bg-blue-500",   ring: "ring-blue-400/40",  text: "text-blue-600 dark:text-blue-400",   line: "bg-blue-400/30" },
  { key: "encode"      as RecommendedStep, label: "Train", Icon: Sparkles,  dot: "bg-purple-500", ring: "ring-purple-400/40", text: "text-purple-600 dark:text-purple-400", line: "bg-purple-400/30" },
  { key: "test"        as RecommendedStep, label: "Test",  Icon: Target,    dot: "bg-emerald-500", ring: "ring-emerald-400/40", text: "text-emerald-600 dark:text-emerald-400", line: "bg-emerald-400/30" },
] as const

function StepTrack({ states }: { states: [StepState, StepState, StepState] }) {
  return (
    <div className="flex items-start">
      {STEP_META.map((step, i) => {
        const state = states[i]
        const isLast = i === STEP_META.length - 1
        return (
          <div key={step.key} className="flex flex-1 items-start">
            {/* Node + label */}
            <div className="flex flex-col items-center gap-1.5 shrink-0">
              <div
                className={cn(
                  "flex size-8 items-center justify-center rounded-full transition-all",
                  state === "complete" && step.dot + " text-white",
                  state === "active" && "bg-background border-2 border-current ring-2 " + step.ring + " " + step.text,
                  state === "upcoming" && "bg-muted text-muted-foreground/40",
                )}
              >
                {state === "complete" ? (
                  <Check className="size-4" />
                ) : (
                  <step.Icon className="size-4" />
                )}
              </div>
              <span
                className={cn(
                  "text-[10px] font-semibold tracking-wide",
                  state === "complete" && "text-foreground",
                  state === "active" && step.text,
                  state === "upcoming" && "text-muted-foreground/40",
                )}
              >
                {step.label}
              </span>
            </div>

            {/* Connecting line */}
            {!isLast && (
              <div className="flex-1 pt-4 px-1">
                <div
                  className={cn(
                    "h-0.5 w-full rounded-full",
                    states[i] === "complete" ? step.line : "bg-border/60",
                  )}
                />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function NextStepPill({ recommended, isAllDone }: { recommended: RecommendedStep; isAllDone: boolean }) {
  if (isAllDone) {
    return (
      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
        <Check className="size-3" />
        Done
      </span>
    )
  }

  const styles = {
    familiarize: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    encode:      "bg-purple-500/10 text-purple-600 dark:text-purple-400",
    test:        "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  }
  const labels = {
    familiarize: "Start Reading",
    encode:      "Train",
    test:        "Take Test",
  }

  return (
    <span className={cn("inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold", styles[recommended])}>
      {labels[recommended]}
      <ChevronRight className="size-3" />
    </span>
  )
}

// Left accent bar colour per recommended step
const ACCENT_BORDER: Record<RecommendedStep, string> = {
  familiarize: "border-l-blue-400",
  encode:      "border-l-purple-400",
  test:        "border-l-emerald-400",
}

// ─── SetCard ──────────────────────────────────────────────────────────────

interface SetCardProps {
  set: MemorizationSet
  onNavigate: (id: string) => void
}

const SetCard = memo(function SetCard({ set, onNavigate }: SetCardProps) {
  const stepStates = getStepStates(set)
  const lastPracticed = set.sessionState.lastVisitedAt
  const wc = countWords(set.content)
  const bestScore = getBestTestScore(set)
  const isAllDone = stepStates.every((s) => s === "complete")
  const hasAudio = !!(set.createdFrom === "voice" || set.audioFilePath)

  return (
    <Card
      className={cn(
        "group overflow-hidden border-l-[3px] transition-all active:scale-[0.99] cursor-pointer touch-manipulation",
        isAllDone ? "border-l-emerald-400" : ACCENT_BORDER[set.recommendedStep],
      )}
      onClick={() => onNavigate(set.id)}
    >
      <CardContent className="flex flex-col gap-4 p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-bold leading-snug text-foreground line-clamp-2 flex-1 text-[17px] tracking-tight">
            {set.title}
          </h3>
          <NextStepPill recommended={set.recommendedStep} isAllDone={isAllDone} />
        </div>

        <StepTrack states={stepStates} />

        <div className="flex items-center justify-between gap-2 pt-0.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="size-3 shrink-0" />
              {lastPracticed ? formatDate(lastPracticed) : "New"}
            </span>

            <span className="text-muted-foreground/30 text-xs">·</span>

            <span className="text-xs text-muted-foreground tabular-nums">
              {wc} words
            </span>

            {bestScore !== null && (
              <>
                <span className="text-muted-foreground/30 text-xs">·</span>
                <span
                  className={cn(
                    "text-xs font-semibold tabular-nums",
                    bestScore >= 90 ? "text-emerald-600 dark:text-emerald-400" :
                    bestScore >= 70 ? "text-amber-600 dark:text-amber-400" :
                    "text-red-500",
                  )}
                >
                  {bestScore}%
                </span>
              </>
            )}

            {hasAudio && (
              <Mic className="size-3 text-muted-foreground/50 shrink-0" />
            )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="shrink-0 h-7 gap-1 px-2 text-xs opacity-50 hover:opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
            asChild
          >
            <Link
              href={`/edit/${set.id}`}
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
              <Edit3 className="size-3" />
              Edit
            </Link>
          </Button>
        </div>

        {set.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {set.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs h-5 px-2 font-normal">
                {tag}
              </Badge>
            ))}
            {set.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs h-5 px-2 font-normal">
                +{set.tags.length - 3}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
})

// ─── Page ─────────────────────────────────────────────────────────────────

export default function HomePage() {
  const router = useRouter()
  const { sets, isLoaded, getAllTags, hasMore, isLoadingMore, loadMore } = useSetList()
  const [showSplash, setShowSplash] = useState(true)
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  const allTags = useMemo(() => getAllTags(), [getAllTags])

  const filteredSets = useMemo(() => {
    let filtered = sets
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (set) =>
          set.title.toLowerCase().includes(query) ||
          set.content.toLowerCase().includes(query),
      )
    }
    if (selectedTags.length > 0) {
      filtered = filtered.filter((set) =>
        selectedTags.every((tag) => set.tags.includes(tag)),
      )
    }
    return filtered
  }, [sets, searchQuery, selectedTags])

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => {
      const newTags = prev.includes(tag)
        ? prev.filter((t) => t !== tag)
        : [...prev, tag]
      trackEvent(AnalyticsEvents.TAG_FILTER_APPLIED, {
        tag_name: tag,
        selected_tags_count: newTags.length,
        filtered_results_count: filteredSets.length,
      })
      return newTags
    })
  }

  const clearFilters = () => {
    const hadSearch = searchQuery !== ""
    const hadTags = selectedTags.length > 0
    setSearchQuery("")
    setSelectedTags([])
    if (hadSearch || hadTags) {
      trackEvent(AnalyticsEvents.FILTERS_CLEARED, {
        had_search: hadSearch,
        had_tags: hadTags,
        total_sets_visible: sets.length,
      })
    }
  }

  useEffect(() => {
    // ?fresh=1 comes from the OAuth callback — always show splash on fresh login
    const params = new URLSearchParams(window.location.search)
    if (params.get("fresh") === "1") {
      sessionStorage.removeItem("verbatim-splash-seen")
      window.history.replaceState({}, "", "/")
      return
    }
    const hasSeenSplash = sessionStorage.getItem("verbatim-splash-seen")
    if (hasSeenSplash) setShowSplash(false)
  }, [])

  useEffect(() => {
    if (!searchQuery.trim()) return
    const timer = setTimeout(() => {
      trackEvent(AnalyticsEvents.SEARCH_PERFORMED, {
        query_length: searchQuery.length,
        has_results: filteredSets.length > 0,
        result_count: filteredSets.length,
      })
    }, 1000)
    return () => clearTimeout(timer)
  }, [searchQuery, filteredSets.length])

  const handleSplashComplete = () => {
    sessionStorage.setItem("verbatim-splash-seen", "true")
    setShowSplash(false)
    const hasSeenOnboarding = localStorage.getItem("hasSeenOnboarding")
    if (!hasSeenOnboarding) {
      setIsCheckingOnboarding(true)
      window.location.href = "/onboarding"
    }
  }

  const handleShowTour = () => router.push("/onboarding")

  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} duration={2000} />
  }

  if (isCheckingOnboarding) {
    return (
      <div className="flex min-h-svh flex-col bg-background">
        <main className="flex flex-1 flex-col items-center justify-center gap-3">
          <Spinner className="size-8" />
        </main>
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className="flex min-h-svh flex-col bg-background">
        <Header title="Library" showBranding={true} />
        <LibrarySkeletons />
      </div>
    )
  }

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <Header
        title="Library"
        showBranding={true}
        action={
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" asChild>
              <Link href="/schedules">
                <CalendarClock className="size-4" />
                <span className="hidden sm:inline text-xs">Schedules</span>
              </Link>
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={handleShowTour} title="View Tour">
              <HelpCircle className="size-5" />
              <span className="sr-only">View Tour</span>
            </Button>
          </div>
        }
      />

      <main className="flex flex-1 flex-col gap-5 p-4 pb-24 md:pb-8">
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
            {/* Today's Practice */}
            <TodaysPracticeBanner />

            {/* Count + create */}
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-0.5">
                <span className="text-2xl font-semibold tabular-nums">{sets.length}</span>
                <span className="text-sm text-muted-foreground">
                  {sets.length === 1 ? "Memorization Set" : "Memorization Sets"}
                </span>
              </div>
              <Button asChild className="gap-2 hidden md:flex">
                <Link href="/create">
                  <Plus className="size-4" />
                  New Memorization
                </Link>
              </Button>
            </div>

            {/* Search */}
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

            {/* Tag filters */}
            {allTags.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">Filter:</span>
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
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 gap-1 text-xs">
                    <X className="size-3" />
                    Clear
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
                  <Button onClick={clearFilters} variant="outline">Clear filters</Button>
                </EmptyContent>
              </Empty>
            ) : (
              <div className="flex flex-col gap-3">
                {filteredSets.map((set) => (
                  <SetCard key={set.id} set={set} onNavigate={(id) => router.push(`/memorization/${id}`)} />
                ))}

                {hasMore && !searchQuery && selectedTags.length === 0 && (
                  <Button
                    variant="outline"
                    onClick={loadMore}
                    disabled={isLoadingMore}
                    className="w-full gap-2"
                  >
                    {isLoadingMore ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      "Load more"
                    )}
                  </Button>
                )}
              </div>
            )}
          </>
        )}
      </main>

      <MobileLibraryNav />
    </div>
  )
}
