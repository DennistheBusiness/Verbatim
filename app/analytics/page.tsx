"use client"

import { useEffect, useMemo, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  BarChart3, Trophy, Target, TrendingUp, TrendingDown, Minus,
  Zap, BookOpenText, ChevronRight, Clock, RotateCcw, Brain,
  Layers, Keyboard, FileText, Headphones, ArrowRight,
} from "lucide-react"
import { Header } from "@/components/header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Spinner } from "@/components/ui/spinner"
import { useSetList } from "@/lib/memorization-context"
import { createClient } from "@/lib/supabase/client"
import {
  Area, AreaChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip,
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
} from "recharts"

// ─── types ───────────────────────────────────────────────────────────────────

interface TestAttempt {
  id: string
  mode: "first_letter" | "full_text" | "audio"
  score: number
  total_words: number
  correct_words: number
  created_at: string
}

interface EncodeAttempt {
  id: string
  stage: "word" | "sentence" | "full"
  score: number
  total_words: number
  correct_words: number
  duration_seconds: number
  created_at: string
}

type ActiveTab = "train" | "test"

// ─── config ──────────────────────────────────────────────────────────────────

const TEST_MODE_META = {
  first_letter: { label: "First Letter",  icon: Keyboard,    color: "bg-blue-500",   light: "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300" },
  full_text:    { label: "Full Recall",   icon: FileText,    color: "bg-violet-500", light: "bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300" },
  audio:        { label: "Audio Recall",  icon: Headphones,  color: "bg-emerald-500",light: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300" },
} as const

const ENCODE_STAGE_META = {
  word:     { label: "Level 1: Word",     icon: Layers,   color: "bg-amber-500",  light: "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300" },
  sentence: { label: "Level 2: Sentence", icon: Brain,    color: "bg-orange-500", light: "bg-orange-50 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300" },
  full:     { label: "Level 3: Full",     icon: Zap,      color: "bg-rose-500",   light: "bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300" },
} as const

// ─── helpers ─────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" })
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
}

function scoreColor(score: number) {
  if (score >= 90) return "text-emerald-600 dark:text-emerald-400"
  if (score >= 70) return "text-blue-600 dark:text-blue-400"
  if (score >= 50) return "text-amber-600 dark:text-amber-400"
  return "text-red-500 dark:text-red-400"
}

function scoreBg(score: number) {
  if (score >= 90) return "bg-emerald-500"
  if (score >= 70) return "bg-blue-500"
  if (score >= 50) return "bg-amber-500"
  return "bg-red-500"
}

function calcStats(scores: number[]) {
  if (scores.length === 0) return { best: null, avg: null, latest: null, trend: null }
  return {
    best: Math.max(...scores),
    avg: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
    latest: scores[scores.length - 1],
    trend: scores.length >= 2 ? scores[scores.length - 1] - scores[0] : null,
  }
}

// ─── sub-components ──────────────────────────────────────────────────────────

function StatBadge({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`flex flex-col items-center gap-0.5 rounded-xl p-3 ${accent ? "bg-primary text-primary-foreground" : "bg-muted/60"}`}>
      <span className={`text-[10px] font-medium uppercase tracking-wider ${accent ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{label}</span>
      <span className="text-xl font-bold tabular-nums leading-none">{value}</span>
    </div>
  )
}

function TrendChip({ trend }: { trend: number | null }) {
  if (trend === null) return null
  const positive = trend > 0
  const neutral = trend === 0
  return (
    <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold ${
      neutral ? "bg-muted text-muted-foreground" :
      positive ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
                 "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
    }`}>
      {neutral ? <Minus className="size-3" /> : positive ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
      {trend > 0 ? "+" : ""}{trend}%
    </span>
  )
}

function MiniChart({ data, color }: { data: { score: number; date: string }[]; color: string }) {
  if (data.length < 2) return null
  return (
    <ResponsiveContainer width="100%" height={80}>
      <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -32 }}>
        <defs>
          <linearGradient id={`grad-${color}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.25} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="score" stroke={color} strokeWidth={1.5} fill={`url(#grad-${color})`} dot={false} />
        <YAxis domain={[0, 100]} hide />
        <XAxis dataKey="date" hide />
        <Tooltip
          contentStyle={{ fontSize: 11, padding: "4px 8px", borderRadius: 6 }}
          formatter={(v: any) => [`${v}%`, "Score"]}
          labelFormatter={(l) => l}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

function MainChart({ data }: { data: { score: number; date: string; label: string }[] }) {
  if (data.length === 0) return (
    <div className="flex h-[160px] items-center justify-center rounded-xl bg-muted/30">
      <p className="text-xs text-muted-foreground">No attempts yet</p>
    </div>
  )
  return (
    <ResponsiveContainer width="100%" height={160}>
      <AreaChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: -20 }}>
        <defs>
          <linearGradient id="mainGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
        <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} interval="preserveStartEnd" />
        <YAxis domain={[0, 100]} tickLine={false} axisLine={false} tick={{ fontSize: 10 }} tickFormatter={(v) => `${v}%`} />
        <Tooltip
          contentStyle={{ fontSize: 12, padding: "6px 10px", borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--background))" }}
          formatter={(v: any, _: any, p: any) => [`${v}% · ${p.payload.label}`, ""]}
          labelFormatter={(l) => l}
        />
        <Area type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#mainGrad)"
          dot={{ r: 3, fill: "hsl(var(--primary))", strokeWidth: 0 }} activeDot={{ r: 5 }} />
      </AreaChart>
    </ResponsiveContainer>
  )
}

function AttemptRow({ mode, label, score, date, time, accent }: {
  mode: string; label: string; score: number; date: string; time: string; accent: string
}) {
  return (
    <div className="flex items-center gap-3 py-2.5">
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white text-[10px] font-bold ${accent}`}>
        {score}%
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{date} · {time}</p>
      </div>
      <span className={`text-lg font-bold tabular-nums ${scoreColor(score)}`}>{score}%</span>
    </div>
  )
}

function MethodBreakdown({ attempts, meta }: { attempts: { mode: string; score: number }[]; meta: Record<string, { label: string; light: string; color: string }> }) {
  const keys = Object.keys(meta) as string[]
  return (
    <div className="flex flex-col gap-2">
      {keys.map((key) => {
        const m = meta[key]
        const group = attempts.filter((a) => a.mode === key)
        if (group.length === 0) return null
        const best = Math.max(...group.map((a) => a.score))
        const avg = Math.round(group.reduce((s, a) => s + a.score, 0) / group.length)
        return (
          <div key={key} className="flex items-center gap-3 rounded-xl bg-muted/40 px-3 py-2.5">
            <div className={`h-2.5 w-2.5 rounded-full ${m.color}`} />
            <span className="flex-1 text-sm font-medium">{m.label}</span>
            <span className="text-xs text-muted-foreground">{group.length} attempt{group.length !== 1 ? "s" : ""}</span>
            <span className={`text-sm font-bold tabular-nums ${scoreColor(best)}`}>Best {best}%</span>
          </div>
        )
      })}
    </div>
  )
}

function RadarCard({ testAttempts, encodeAttempts }: { testAttempts: TestAttempt[]; encodeAttempts: EncodeAttempt[] }) {
  const data = [
    { subject: "First Letter", value: calcStats(testAttempts.filter(a => a.mode === "first_letter").map(a => a.score)).best ?? 0 },
    { subject: "Full Recall",  value: calcStats(testAttempts.filter(a => a.mode === "full_text").map(a => a.score)).best ?? 0 },
    { subject: "Audio",        value: calcStats(testAttempts.filter(a => a.mode === "audio").map(a => a.score)).best ?? 0 },
    { subject: "Train L1",     value: calcStats(encodeAttempts.filter(a => a.stage === "word").map(a => a.score)).best ?? 0 },
    { subject: "Train L2",     value: calcStats(encodeAttempts.filter(a => a.stage === "sentence").map(a => a.score)).best ?? 0 },
    { subject: "Train L3",     value: calcStats(encodeAttempts.filter(a => a.stage === "full").map(a => a.score)).best ?? 0 },
  ]
  const hasData = data.some(d => d.value > 0)
  if (!hasData) return null
  return (
    <Card>
      <CardContent className="p-4">
        <p className="mb-1 text-sm font-semibold">Performance Radar</p>
        <p className="mb-3 text-xs text-muted-foreground">Best score across all modes</p>
        <ResponsiveContainer width="100%" height={200}>
          <RadarChart data={data}>
            <PolarGrid stroke="hsl(var(--border))" />
            <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
            <Radar dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.15} strokeWidth={2} dot={{ r: 3, fill: "hsl(var(--primary))" }} />
          </RadarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

// ─── main page ───────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const router = useRouter()
  const { sets, isLoaded } = useSetList()
  const [selectedSetId, setSelectedSetId] = useState<string>("")
  const [activeTab, setActiveTab] = useState<ActiveTab>("train")
  const [testFilter, setTestFilter] = useState<"all" | "first_letter" | "full_text" | "audio">("all")
  const [encodeFilter, setEncodeFilter] = useState<"all" | "word" | "sentence" | "full">("all")
  const [testAttempts, setTestAttempts] = useState<TestAttempt[]>([])
  const [encodeAttempts, setEncodeAttempts] = useState<EncodeAttempt[]>([])
  const [isDataLoading, setIsDataLoading] = useState(false)
  const [setFromQuery, setSetFromQuery] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === "undefined") return
    const q = new URLSearchParams(window.location.search).get("set")
    setSetFromQuery(q)
  }, [])

  useEffect(() => {
    if (sets.length === 0) { setSelectedSetId(""); return }
    if (setFromQuery && sets.some((s) => s.id === setFromQuery)) { setSelectedSetId(setFromQuery); return }
    if (!selectedSetId || !sets.some((s) => s.id === selectedSetId)) setSelectedSetId(sets[0].id)
  }, [selectedSetId, setFromQuery, sets])

  const fetchData = useCallback(async (setId: string) => {
    setIsDataLoading(true)
    const supabase = createClient()
    const [{ data: t }, { data: e }] = await Promise.all([
      supabase.from("test_attempts").select("id,mode,score,total_words,correct_words,created_at").eq("set_id", setId).order("created_at", { ascending: true }),
      supabase.from("encoding_attempts").select("id,stage,score,total_words,correct_words,duration_seconds,created_at").eq("set_id", setId).order("created_at", { ascending: true }),
    ])
    setTestAttempts((t ?? []) as TestAttempt[])
    setEncodeAttempts((e ?? []) as EncodeAttempt[])
    setIsDataLoading(false)
  }, [])

  useEffect(() => {
    if (selectedSetId) fetchData(selectedSetId)
  }, [selectedSetId, fetchData])

  const selectedSet = useMemo(() => sets.find((s) => s.id === selectedSetId) ?? null, [selectedSetId, sets])

  // derived
  const filteredTestAttempts = useMemo(() =>
    testFilter === "all" ? testAttempts : testAttempts.filter((a) => a.mode === testFilter),
    [testAttempts, testFilter])

  const filteredEncodeAttempts = useMemo(() =>
    encodeFilter === "all" ? encodeAttempts : encodeAttempts.filter((a) => a.stage === encodeFilter),
    [encodeAttempts, encodeFilter])

  const testStats = useMemo(() => calcStats(filteredTestAttempts.map((a) => a.score)), [filteredTestAttempts])
  const encodeStats = useMemo(() => calcStats(filteredEncodeAttempts.map((a) => a.score)), [filteredEncodeAttempts])

  const testChartData = filteredTestAttempts.map((a) => ({
    score: a.score, date: fmtDate(a.created_at),
    label: TEST_MODE_META[a.mode]?.label ?? a.mode,
  }))
  const encodeChartData = filteredEncodeAttempts.map((a) => ({
    score: a.score, date: fmtDate(a.created_at),
    label: ENCODE_STAGE_META[a.stage as keyof typeof ENCODE_STAGE_META]?.label ?? a.stage,
  }))

  const progress = selectedSet?.progress
  const teachDone = progress?.familiarizeCompleted ?? false
  const trainDone = progress?.encode?.stage1Completed && progress?.encode?.stage2Completed && progress?.encode?.stage3Completed
  const testBestFirstLetter = progress?.tests?.firstLetter?.bestScore ?? null
  const testBestFull = progress?.tests?.fullText?.bestScore ?? null
  const testBestAudio = progress?.tests?.audioTest?.bestScore ?? null
  const testDone = testBestFirstLetter !== null && testBestFull !== null && testBestAudio !== null

  // ─── loading / empty states ─────────────────────────────────────

  if (!isLoaded) return (
    <div className="flex min-h-svh flex-col">
      <Header title="Analytics" showBack />
      <main className="flex flex-1 flex-col items-center justify-center gap-3">
        <Spinner className="size-8" /><p className="text-sm text-muted-foreground">Loading...</p>
      </main>
    </div>
  )

  if (sets.length === 0) return (
    <div className="flex min-h-svh flex-col">
      <Header title="Analytics" showBack />
      <main className="flex flex-1 flex-col items-center justify-center p-4">
        <Empty className="max-w-sm border-0">
          <EmptyHeader>
            <EmptyMedia variant="icon" className="size-14 rounded-full bg-muted text-muted-foreground [&_svg]:size-6"><BarChart3 /></EmptyMedia>
            <EmptyTitle>No sets yet</EmptyTitle>
            <EmptyDescription>Create your first memorization set to start tracking analytics.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent><Button onClick={() => router.push("/create")} className="w-full">Create Memorization</Button></EmptyContent>
        </Empty>
      </main>
    </div>
  )

  // ─── main render ────────────────────────────────────────────────

  return (
    <div className="flex min-h-svh flex-col bg-muted/20">
      <Header title="Analytics" showBack />

      <main className="flex flex-1 flex-col gap-4 p-4 pb-28 md:pb-10">

        {/* ── Set Picker ── */}
        <div className="-mx-4 overflow-x-auto px-4">
          <div className="flex gap-2 pb-1" style={{ width: "max-content" }}>
            {sets.map((set) => (
              <button
                key={set.id}
                onClick={() => setSelectedSetId(set.id)}
                className={`flex shrink-0 flex-col rounded-2xl border px-4 py-2.5 text-left transition-all ${
                  selectedSetId === set.id
                    ? "border-primary bg-primary text-primary-foreground shadow-md"
                    : "border-border bg-card text-foreground hover:border-primary/40"
                }`}
              >
                <span className="max-w-[160px] truncate text-sm font-semibold leading-tight">{set.title}</span>
                <span className={`mt-0.5 text-[10px] font-medium ${selectedSetId === set.id ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                  {set.chunks?.length ?? 0} chunks
                </span>
              </button>
            ))}
          </div>
        </div>

        {selectedSet && !isDataLoading && (
          <>
            {/* ── Progress Summary Hero ── */}
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Overall Progress</p>
                      <p className="text-4xl font-bold tabular-nums">
                        {Math.round(((teachDone ? 33 : 0) + (trainDone ? 33 : 0) + (testDone ? 34 : 0)))}%
                      </p>
                    </div>
                    <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${teachDone && trainDone && testDone ? "bg-emerald-500" : "bg-primary/20"}`}>
                      <Trophy className={`size-7 ${teachDone && trainDone && testDone ? "text-white" : "text-primary"}`} />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {[
                      { label: "Teach", done: teachDone, icon: BookOpenText },
                      { label: "Train", done: trainDone, icon: Brain },
                      { label: "Test",  done: testDone,  icon: Target },
                    ].map(({ label, done, icon: Icon }) => (
                      <div key={label} className={`flex flex-1 items-center gap-1.5 rounded-xl px-2.5 py-2 ${done ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-muted/60"}`}>
                        <Icon className={`size-3.5 ${done ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`} />
                        <div>
                          <p className={`text-[10px] font-bold uppercase tracking-wide ${done ? "text-emerald-700 dark:text-emerald-300" : "text-muted-foreground"}`}>{label}</p>
                          <p className={`text-[10px] ${done ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`}>{done ? "Done" : "In progress"}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick micro-stats row */}
                <div className="grid grid-cols-3 divide-x divide-border border-t">
                  {[
                    { label: "Train Sessions", value: encodeAttempts.length },
                    { label: "Test Sessions", value: testAttempts.length },
                    { label: "Best Test", value: testStats.best !== null ? `${testStats.best}%` : "—" },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex flex-col items-center py-3">
                      <span className="text-lg font-bold tabular-nums">{value}</span>
                      <span className="text-[10px] text-muted-foreground">{label}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* ── Mode Tab Toggle ── */}
            <div className="flex rounded-2xl bg-muted p-1">
              {(["train", "test"] as ActiveTab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all ${
                    activeTab === tab ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {tab === "train" ? <Brain className="size-4" /> : <Target className="size-4" />}
                  {tab === "train" ? "Train" : "Test"}
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${activeTab === tab ? "bg-primary text-primary-foreground" : "bg-muted-foreground/20 text-muted-foreground"}`}>
                    {tab === "train" ? encodeAttempts.length : testAttempts.length}
                  </span>
                </button>
              ))}
            </div>

            {/* ── TRAIN TAB ── */}
            {activeTab === "train" && (
              <div className="flex flex-col gap-4">
                {encodeAttempts.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center gap-3 py-10">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted"><Brain className="size-6 text-muted-foreground" /></div>
                      <p className="text-sm font-medium">No training sessions yet</p>
                      <p className="text-center text-xs text-muted-foreground">Complete the First Letter Method to start building your score history.</p>
                      <Button size="sm" onClick={() => router.push(`/memorization/${selectedSet.id}`)}>
                        Start Training <ArrowRight className="ml-1.5 size-3.5" />
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    {/* Stage filter pills */}
                    <div className="flex flex-wrap gap-1.5">
                      {(["all", "word", "sentence", "full"] as const).map((f) => {
                        const count = f === "all" ? encodeAttempts.length : encodeAttempts.filter(a => a.stage === f).length
                        if (f !== "all" && count === 0) return null
                        const meta = f === "all" ? null : ENCODE_STAGE_META[f]
                        return (
                          <button key={f} onClick={() => setEncodeFilter(f)}
                            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                              encodeFilter === f ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground hover:bg-muted/80"
                            }`}
                          >
                            {meta && <span className={`h-1.5 w-1.5 rounded-full ${meta.color}`} />}
                            {f === "all" ? "All Stages" : meta?.label}
                            <span className="opacity-60">({count})</span>
                          </button>
                        )
                      })}
                    </div>

                    {/* Stats row */}
                    <div className="grid grid-cols-4 gap-2">
                      <StatBadge label="Best" value={encodeStats.best !== null ? `${encodeStats.best}%` : "—"} accent />
                      <StatBadge label="Latest" value={encodeStats.latest !== null ? `${encodeStats.latest}%` : "—"} />
                      <StatBadge label="Avg" value={encodeStats.avg !== null ? `${encodeStats.avg}%` : "—"} />
                      <StatBadge label="Total" value={String(filteredEncodeAttempts.length)} />
                    </div>

                    {/* Chart */}
                    <Card>
                      <CardContent className="p-4">
                        <div className="mb-3 flex items-center justify-between">
                          <p className="text-sm font-semibold">Score History</p>
                          <TrendChip trend={encodeStats.trend} />
                        </div>
                        <MainChart data={encodeChartData} />
                      </CardContent>
                    </Card>

                    {/* Stage breakdown */}
                    <Card>
                      <CardContent className="p-4">
                        <p className="mb-3 text-sm font-semibold">By Stage</p>
                        <MethodBreakdown
                          attempts={encodeAttempts.map(a => ({ mode: a.stage, score: a.score }))}
                          meta={Object.fromEntries(Object.entries(ENCODE_STAGE_META).map(([k,v]) => [k, v]))}
                        />
                      </CardContent>
                    </Card>

                    {/* Recent attempts */}
                    <Card>
                      <CardContent className="p-4">
                        <p className="mb-1 text-sm font-semibold">Recent Sessions</p>
                        <p className="mb-3 text-xs text-muted-foreground">Latest {Math.min(filteredEncodeAttempts.length, 10)} of {filteredEncodeAttempts.length}</p>
                        <div className="divide-y divide-border/50">
                          {[...filteredEncodeAttempts].reverse().slice(0, 10).map((a) => {
                            const meta = ENCODE_STAGE_META[a.stage as keyof typeof ENCODE_STAGE_META]
                            return (
                              <AttemptRow key={a.id}
                                mode={a.stage} label={meta?.label ?? a.stage}
                                score={a.score} date={fmtDate(a.created_at)} time={fmtTime(a.created_at)}
                                accent={`${meta?.color ?? "bg-primary"}`}
                              />
                            )
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}
              </div>
            )}

            {/* ── TEST TAB ── */}
            {activeTab === "test" && (
              <div className="flex flex-col gap-4">
                {testAttempts.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center gap-3 py-10">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted"><Target className="size-6 text-muted-foreground" /></div>
                      <p className="text-sm font-medium">No test sessions yet</p>
                      <p className="text-center text-xs text-muted-foreground">Complete a First Letter, Full Recall, or Audio Recall test to start tracking.</p>
                      <Button size="sm" onClick={() => router.push(`/memorization/${selectedSet.id}`)}>
                        Start Testing <ArrowRight className="ml-1.5 size-3.5" />
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    {/* Method filter pills */}
                    <div className="flex flex-wrap gap-1.5">
                      {(["all", "first_letter", "full_text", "audio"] as const).map((f) => {
                        const count = f === "all" ? testAttempts.length : testAttempts.filter(a => a.mode === f).length
                        if (f !== "all" && count === 0) return null
                        const meta = f === "all" ? null : TEST_MODE_META[f]
                        return (
                          <button key={f} onClick={() => setTestFilter(f)}
                            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                              testFilter === f ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground hover:bg-muted/80"
                            }`}
                          >
                            {meta && <span className={`h-1.5 w-1.5 rounded-full ${meta.color}`} />}
                            {f === "all" ? "All Tests" : meta?.label}
                            <span className="opacity-60">({count})</span>
                          </button>
                        )
                      })}
                    </div>

                    {/* Stats row */}
                    <div className="grid grid-cols-4 gap-2">
                      <StatBadge label="Best" value={testStats.best !== null ? `${testStats.best}%` : "—"} accent />
                      <StatBadge label="Latest" value={testStats.latest !== null ? `${testStats.latest}%` : "—"} />
                      <StatBadge label="Avg" value={testStats.avg !== null ? `${testStats.avg}%` : "—"} />
                      <StatBadge label="Total" value={String(filteredTestAttempts.length)} />
                    </div>

                    {/* Chart */}
                    <Card>
                      <CardContent className="p-4">
                        <div className="mb-3 flex items-center justify-between">
                          <p className="text-sm font-semibold">Score History</p>
                          <TrendChip trend={testStats.trend} />
                        </div>
                        <MainChart data={testChartData} />
                      </CardContent>
                    </Card>

                    {/* Method breakdown */}
                    <Card>
                      <CardContent className="p-4">
                        <p className="mb-3 text-sm font-semibold">By Method</p>
                        <MethodBreakdown
                          attempts={testAttempts.map(a => ({ mode: a.mode, score: a.score }))}
                          meta={Object.fromEntries(Object.entries(TEST_MODE_META).map(([k,v]) => [k, v]))}
                        />
                      </CardContent>
                    </Card>

                    {/* Personal bests per method */}
                    <div className="grid grid-cols-3 gap-2">
                      {(["first_letter", "full_text", "audio"] as const).map((m) => {
                        const meta = TEST_MODE_META[m]
                        const Icon = meta.icon
                        const scores = testAttempts.filter(a => a.mode === m).map(a => a.score)
                        const best = scores.length > 0 ? Math.max(...scores) : null
                        return (
                          <div key={m} className="flex flex-col items-center gap-1.5 rounded-2xl border bg-card p-3 text-center">
                            <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${meta.color}`}>
                              <Icon className="size-4 text-white" />
                            </div>
                            <span className="text-[10px] font-medium text-muted-foreground leading-tight">{meta.label}</span>
                            <span className={`text-xl font-bold tabular-nums leading-none ${best !== null ? scoreColor(best) : "text-muted-foreground"}`}>
                              {best !== null ? `${best}%` : "—"}
                            </span>
                            <span className="text-[10px] text-muted-foreground">{scores.length} attempt{scores.length !== 1 ? "s" : ""}</span>
                          </div>
                        )
                      })}
                    </div>

                    {/* Recent attempts */}
                    <Card>
                      <CardContent className="p-4">
                        <p className="mb-1 text-sm font-semibold">Recent Sessions</p>
                        <p className="mb-3 text-xs text-muted-foreground">Latest {Math.min(filteredTestAttempts.length, 10)} of {filteredTestAttempts.length}</p>
                        <div className="divide-y divide-border/50">
                          {[...filteredTestAttempts].reverse().slice(0, 10).map((a) => {
                            const meta = TEST_MODE_META[a.mode]
                            return (
                              <AttemptRow key={a.id}
                                mode={a.mode} label={meta?.label ?? a.mode}
                                score={a.score} date={fmtDate(a.created_at)} time={fmtTime(a.created_at)}
                                accent={`${meta?.color ?? "bg-primary"}`}
                              />
                            )
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}
              </div>
            )}

            {/* ── Radar (only when both types have data) ── */}
            {testAttempts.length > 0 && encodeAttempts.length > 0 && (
              <RadarCard testAttempts={testAttempts} encodeAttempts={encodeAttempts} />
            )}

            {/* ── Go to Set CTA ── */}
            <button
              onClick={() => router.push(`/memorization/${selectedSet.id}`)}
              className="flex items-center justify-between rounded-2xl border bg-card px-4 py-3.5 transition-colors hover:bg-muted/40 active:bg-muted/60"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                  <Zap className="size-4 text-primary" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold">Continue Memorizing</p>
                  <p className="text-xs text-muted-foreground truncate max-w-[200px]">{selectedSet.title}</p>
                </div>
              </div>
              <ChevronRight className="size-4 text-muted-foreground" />
            </button>
          </>
        )}

        {isDataLoading && (
          <div className="flex flex-1 items-center justify-center py-12">
            <Spinner className="size-6" />
          </div>
        )}
      </main>
    </div>
  )
}

