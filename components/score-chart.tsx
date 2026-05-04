"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { ScoreChartSkeleton } from "@/components/loading-skeletons"

interface Attempt {
  id: string
  bucket: string
  source: "test" | "encode"
  score: number
  created_at: string
}

type ChartMode = "test" | "encode" | "all"
type TestFilterMode = "all" | "first_letter" | "full_text" | "audio"
type EncodeFilterMode = "all" | "word" | "sentence" | "full"

interface ScoreChartProps {
  setId: string
  onStartTest: () => void
  mode?: ChartMode
  emptyStateCtaLabel?: string
  emptyStateDescription?: string
}

const MODE_LABELS: Record<ChartMode, string> = {
  all: "All",
  test: "Test",
  encode: "Encode",
}

const TEST_FILTER_LABELS: Record<TestFilterMode, string> = {
  all: "All",
  first_letter: "First Letter",
  full_text: "Full Recall",
  audio: "Audio",
}

const ENCODE_FILTER_LABELS: Record<EncodeFilterMode, string> = {
  all: "All",
  word: "Word",
  sentence: "Sentence",
  full: "Full",
}

const chartConfig: ChartConfig = {
  score: {
    label: "Score",
    color: "hsl(var(--primary))",
  },
}

export function ScoreChart({
  setId,
  onStartTest,
  mode = "all",
  emptyStateCtaLabel = "Take a Test",
  emptyStateDescription = "Complete your first test to see your progress over time",
}: ScoreChartProps) {
  const [testAttempts, setTestAttempts] = useState<Attempt[]>([])
  const [encodeAttempts, setEncodeAttempts] = useState<Attempt[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeMode, setActiveMode] = useState<ChartMode>(mode)
  const [activeTestFilter, setActiveTestFilter] = useState<TestFilterMode>("all")
  const [activeEncodeFilter, setActiveEncodeFilter] = useState<EncodeFilterMode>("all")

  useEffect(() => {
    setActiveMode(mode)
  }, [mode])

  useEffect(() => {
    const supabase = createClient()
    setIsLoading(true)

    Promise.all([
      supabase
        .from("test_attempts")
        .select("id, mode, score, created_at")
        .eq("set_id", setId)
        .order("created_at", { ascending: true }),
      supabase
        .from("encoding_attempts")
        .select("id, stage, score, created_at")
        .eq("set_id", setId)
        .order("created_at", { ascending: true }),
    ]).then(([testResult, encodeResult]) => {
      if (!testResult.error && testResult.data) {
        setTestAttempts(
          testResult.data.map((item) => ({
            id: item.id,
            bucket: item.mode,
            source: "test" as const,
            score: item.score,
            created_at: item.created_at,
          }))
        )
      }

      if (!encodeResult.error && encodeResult.data) {
        setEncodeAttempts(
          encodeResult.data.map((item) => ({
            id: item.id,
            bucket: item.stage,
            source: "encode" as const,
            score: item.score,
            created_at: item.created_at,
          }))
        )
      }

        setIsLoading(false)
      })
  }, [setId])

  const allAttempts = useMemo(
    () => [...testAttempts, ...encodeAttempts].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
    [encodeAttempts, testAttempts]
  )

  const filteredAttempts = useMemo(() => {
    if (activeMode === "test") {
      return activeTestFilter === "all"
        ? testAttempts
        : testAttempts.filter((attempt) => attempt.bucket === activeTestFilter)
    }

    if (activeMode === "encode") {
      return activeEncodeFilter === "all"
        ? encodeAttempts
        : encodeAttempts.filter((attempt) => attempt.bucket === activeEncodeFilter)
    }

    return allAttempts
  }, [activeEncodeFilter, activeMode, activeTestFilter, allAttempts, encodeAttempts, testAttempts])

  const formatBucketLabel = (attempt: Attempt): string => {
    if (attempt.source === "test") {
      return TEST_FILTER_LABELS[attempt.bucket as TestFilterMode] ?? "Test"
    }
    return ENCODE_FILTER_LABELS[attempt.bucket as EncodeFilterMode] ?? "Encode"
  }

  const chartData = filteredAttempts.map((a, i) => ({
    index: i + 1,
    score: a.score,
    date: new Date(a.created_at).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    }),
    mode: formatBucketLabel(a),
    source: a.source,
  }))

  const scores = filteredAttempts.map((a) => a.score)
  const bestScore = scores.length > 0 ? Math.max(...scores) : null
  const latestScore = scores.length > 0 ? scores[scores.length - 1] : null
  const avgScore =
    scores.length > 0
      ? Math.round(scores.reduce((s, v) => s + v, 0) / scores.length)
      : null
  const totalAttempts = filteredAttempts.length
  const trend =
    scores.length >= 2 ? scores[scores.length - 1] - scores[0] : null

  const hasAttempts = filteredAttempts.length > 0
  const hasAnyAttempts = allAttempts.length > 0

  if (isLoading) return <ScoreChartSkeleton />

  // Show empty state if no attempts exist at all (across all modes)
  if (!hasAnyAttempts) {
    return (
      <Card>
        <CardContent className="p-0">
          <Empty className="border-0 py-8">
            <EmptyHeader>
              <EmptyMedia
                variant="icon"
                className="size-12 rounded-full bg-muted text-muted-foreground [&_svg]:size-5"
              >
                <TrendingUp />
              </EmptyMedia>
              <EmptyTitle>No test history yet</EmptyTitle>
              <EmptyDescription>
                {emptyStateDescription}
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button onClick={onStartTest} className="w-full">
                {emptyStateCtaLabel}
              </Button>
            </EmptyContent>
          </Empty>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-4">
        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(MODE_LABELS) as ChartMode[]).map((chartMode) => {
            const count = chartMode === "test"
              ? testAttempts.length
              : chartMode === "encode"
              ? encodeAttempts.length
              : allAttempts.length

            return (
              <button
                key={chartMode}
                onClick={() => setActiveMode(chartMode)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  activeMode === chartMode
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {MODE_LABELS[chartMode]}
                <span className="ml-1 opacity-70">({count})</span>
              </button>
            )
          })}
        </div>

        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Progress Over Time</h3>
          {trend !== null && (
            <div
              className={`flex items-center gap-1 text-xs font-medium ${
                trend > 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : trend < 0
                  ? "text-red-500"
                  : "text-muted-foreground"
              }`}
            >
              {trend > 0 ? (
                <TrendingUp className="size-3.5" />
              ) : trend < 0 ? (
                <TrendingDown className="size-3.5" />
              ) : (
                <Minus className="size-3.5" />
              )}
              <span>
                {trend > 0 ? "+" : ""}
                {trend}%
              </span>
            </div>
          )}
        </div>

        {activeMode === "test" && (
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(TEST_FILTER_LABELS) as TestFilterMode[]).map((filterMode) => {
              const count = filterMode === "all"
                ? testAttempts.length
                : testAttempts.filter((a) => a.bucket === filterMode).length
              if (filterMode !== "all" && count === 0) return null

              return (
                <button
                  key={filterMode}
                  onClick={() => setActiveTestFilter(filterMode)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    activeTestFilter === filterMode
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {TEST_FILTER_LABELS[filterMode]}
                  {count > 0 && <span className="ml-1 opacity-70">({count})</span>}
                </button>
              )
            })}
          </div>
        )}

        {activeMode === "encode" && (
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(ENCODE_FILTER_LABELS) as EncodeFilterMode[]).map((filterMode) => {
              const count = filterMode === "all"
                ? encodeAttempts.length
                : encodeAttempts.filter((a) => a.bucket === filterMode).length
              if (filterMode !== "all" && count === 0) return null

              return (
                <button
                  key={filterMode}
                  onClick={() => setActiveEncodeFilter(filterMode)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    activeEncodeFilter === filterMode
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {ENCODE_FILTER_LABELS[filterMode]}
                  {count > 0 && <span className="ml-1 opacity-70">({count})</span>}
                </button>
              )
            })}
          </div>
        )}

        {/* Stat cards */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "Best", value: bestScore !== null ? `${bestScore}%` : "—" },
            { label: "Latest", value: latestScore !== null ? `${latestScore}%` : "—" },
            { label: "Average", value: avgScore !== null ? `${avgScore}%` : "—" },
            { label: "Attempts", value: totalAttempts.toString() },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="flex flex-col items-center gap-0.5 rounded-lg bg-muted/50 p-2.5"
            >
              <span className="text-xs text-muted-foreground">{label}</span>
              <span className="text-base font-bold tabular-nums leading-tight">
                {value}
              </span>
            </div>
          ))}
        </div>

        {/* Chart or filtered-empty message */}
        {hasAttempts ? (
          <ChartContainer
            config={chartConfig}
            className="h-[180px] w-full md:h-[240px] [&_.recharts-wrapper]:!aspect-auto"
          >
            <AreaChart
              data={chartData}
              margin={{ top: 8, right: 4, bottom: 0, left: -20 }}
            >
              <defs>
                <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="hsl(var(--primary))"
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor="hsl(var(--primary))"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11 }}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={[0, 100]}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11 }}
                tickFormatter={(v) => `${v}%`}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value) => [`${value}%`, "Score"]}
                  />
                }
              />
              <Area
                type="monotone"
                dataKey="score"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#scoreGradient)"
                dot={{ r: 3, fill: "hsl(var(--primary))", strokeWidth: 0 }}
                activeDot={{ r: 5 }}
              />
            </AreaChart>
          </ChartContainer>
        ) : (
          <div className="flex h-[100px] items-center justify-center rounded-lg bg-muted/30">
            <p className="text-xs text-muted-foreground">
              {activeMode === "test"
                ? `No ${TEST_FILTER_LABELS[activeTestFilter].toLowerCase()} test attempts yet`
                : activeMode === "encode"
                ? `No ${ENCODE_FILTER_LABELS[activeEncodeFilter].toLowerCase()} encode attempts yet`
                : "No attempts yet"}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
