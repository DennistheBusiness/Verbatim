"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { BarChart3 } from "lucide-react"
import { Header } from "@/components/header"
import { ScoreChart } from "@/components/score-chart"
import { useSetList } from "@/lib/memorization-context"
import { Card, CardContent } from "@/components/ui/card"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"

export default function AnalyticsPage() {
  const router = useRouter()
  const { sets, isLoaded } = useSetList()
  const [selectedSetId, setSelectedSetId] = useState<string>("")
  const [setFromQuery, setSetFromQuery] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === "undefined") return
    const querySetId = new URLSearchParams(window.location.search).get("set")
    setSetFromQuery(querySetId)
  }, [])

  useEffect(() => {
    if (sets.length === 0) {
      setSelectedSetId("")
      return
    }

    if (setFromQuery && sets.some((set) => set.id === setFromQuery) && selectedSetId !== setFromQuery) {
      setSelectedSetId(setFromQuery)
      return
    }

    if (!selectedSetId || !sets.some((set) => set.id === selectedSetId)) {
      setSelectedSetId(sets[0].id)
    }
  }, [selectedSetId, setFromQuery, sets])

  const selectedSet = useMemo(
    () => sets.find((set) => set.id === selectedSetId) ?? null,
    [selectedSetId, sets]
  )

  if (!isLoaded) {
    return (
      <div className="flex min-h-svh flex-col">
        <Header title="Analytics" showBack />
        <main className="flex flex-1 flex-col items-center justify-center gap-3">
          <Spinner className="size-8" />
          <p className="text-sm text-muted-foreground">Loading analytics...</p>
        </main>
      </div>
    )
  }

  if (sets.length === 0) {
    return (
      <div className="flex min-h-svh flex-col">
        <Header title="Analytics" showBack />
        <main className="flex flex-1 flex-col items-center justify-center p-4">
          <Empty className="max-w-sm border-0">
            <EmptyHeader>
              <EmptyMedia variant="icon" className="size-14 rounded-full bg-muted text-muted-foreground [&_svg]:size-6">
                <BarChart3 />
              </EmptyMedia>
              <EmptyTitle>No sets yet</EmptyTitle>
              <EmptyDescription>
                Create your first memorization set to start tracking analytics.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button onClick={() => router.push("/create")} className="w-full">
                Create Memorization
              </Button>
            </EmptyContent>
          </Empty>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-svh flex-col">
      <Header title="Analytics" showBack />
      <main className="flex flex-1 flex-col gap-4 p-4 pb-24 md:pb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="analytics-set" className="text-sm font-medium">Memorization Set</label>
              <select
                id="analytics-set"
                value={selectedSetId}
                onChange={(event) => setSelectedSetId(event.target.value)}
                className="h-10 rounded-md border bg-background px-3 text-sm"
              >
                {sets.map((set) => (
                  <option key={set.id} value={set.id}>
                    {set.title}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        {selectedSet && (
          <ScoreChart
            setId={selectedSet.id}
            mode="all"
            onStartTest={() => router.push(`/memorization/${selectedSet.id}`)}
            emptyStateCtaLabel="Go to Memorization"
            emptyStateDescription="Start a training or test session to populate analytics."
          />
        )}
      </main>
    </div>
  )
}
