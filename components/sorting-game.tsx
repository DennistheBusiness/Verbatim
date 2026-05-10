'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { GripVertical, ChevronUp, ChevronDown, CheckCircle2, XCircle, Trophy, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SessionLayout } from '@/components/session-layout'
import { trackEvent } from '@/lib/analytics'
import { SORTING_GAME_STARTED, SORTING_GAME_COMPLETED } from '@/lib/analytics-events'
import type { ChunkMode } from '@/lib/memorization-context'
import { cn } from '@/lib/utils'
import { hapticSuccess } from '@/lib/haptics'

interface Chunk {
  id: string
  text: string
  orderIndex: number
}

interface SortingGameProps {
  setId: string
  chunks: Chunk[]
  chunkMode: ChunkMode
  onChunkModeChange: (mode: ChunkMode) => void
  onBack: () => void
  onFinish: () => void
  onScore?: (score: number) => void
}

interface ItemResult {
  chunkId: string
  text: string
  isCorrect: boolean
  placedPosition: number
  correctPosition: number
}

interface Results {
  correctCount: number
  totalCount: number
  score: number
  itemResults: ItemResult[]
}

function fisherYates<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function shuffle<T extends { orderIndex: number }>(arr: T[]): T[] {
  if (arr.length <= 1) return [...arr]
  let result = fisherYates(arr)
  const isSorted = result.every((item, i) => item.orderIndex === arr[i].orderIndex)
  if (isSorted) result = [...result.slice(1), result[0]]
  return result
}

export function SortingGame({ setId, chunks, chunkMode, onChunkModeChange, onBack, onFinish, onScore }: SortingGameProps) {
  const [items, setItems] = useState<Chunk[]>(() => shuffle(chunks))
  const [submitted, setSubmitted] = useState(false)
  const [results, setResults] = useState<Results | null>(null)
  // draft values for the position inputs — tracks what the user is typing
  const [draftPositions, setDraftPositions] = useState<Record<string, string>>({})
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const dragIndexRef = useRef<number | null>(null)
  const touchDragIndexRef = useRef<number | null>(null)
  const dragOverIndexRef = useRef<number | null>(null)
  const itemRectsRef = useRef<DOMRect[]>([])
  const listRef = useRef<HTMLDivElement>(null)
  const startTime = useRef<Date>(new Date())

  useEffect(() => {
    trackEvent(SORTING_GAME_STARTED, { set_id: setId, chunk_count: chunks.length, chunk_mode: chunkMode })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!submitted) setItems(shuffle(chunks))
  }, [chunks]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Arrow reorder ────────────────────────────────────────────────────────────

  const handleMoveUp = useCallback((index: number) => {
    if (index === 0) return
    setItems((prev) => {
      const next = [...prev]
      ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
      return next
    })
  }, [])

  const handleMoveDown = useCallback((index: number) => {
    setItems((prev) => {
      if (index === prev.length - 1) return prev
      const next = [...prev]
      ;[next[index], next[index + 1]] = [next[index + 1], next[index]]
      return next
    })
  }, [])

  // ── Numeric position input ───────────────────────────────────────────────────

  const handlePositionFocus = (id: string, currentIndex: number) => {
    setDraftPositions((d) => ({ ...d, [id]: String(currentIndex + 1) }))
  }

  const handlePositionChange = (id: string, value: string) => {
    setDraftPositions((d) => ({ ...d, [id]: value }))
  }

  const handlePositionCommit = useCallback((id: string, rawValue: string) => {
    const target = parseInt(rawValue, 10)
    setDraftPositions((d) => {
      const next = { ...d }
      delete next[id]
      return next
    })
    setItems((prev) => {
      const fromIndex = prev.findIndex((c) => c.id === id)
      const toIndex = Math.max(0, Math.min(prev.length - 1, target - 1))
      if (fromIndex === -1 || fromIndex === toIndex || isNaN(target)) return prev
      const next = [...prev]
      const [moved] = next.splice(fromIndex, 1)
      next.splice(toIndex, 0, moved)
      return next
    })
  }, [])

  // ── HTML5 drag-and-drop ──────────────────────────────────────────────────────

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    dragIndexRef.current = index
    e.dataTransfer.effectAllowed = 'move'
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverIndex(index)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    const dragIndex = dragIndexRef.current
    if (dragIndex === null || dragIndex === dropIndex) {
      setDragOverIndex(null)
      return
    }
    setItems((prev) => {
      const next = [...prev]
      const [removed] = next.splice(dragIndex, 1)
      next.splice(dropIndex, 0, removed)
      return next
    })
    dragIndexRef.current = null
    setDragOverIndex(null)
  }, [])

  const handleDragEnd = useCallback(() => {
    dragIndexRef.current = null
    setDragOverIndex(null)
  }, [])

  // ── Touch drag-and-drop (mobile) ─────────────────────────────────────────────

  const handleGripTouchStart = useCallback((e: React.TouchEvent, index: number) => {
    e.preventDefault()
    e.stopPropagation()
    touchDragIndexRef.current = index
    dragOverIndexRef.current = index
    setDragOverIndex(index)

    const onTouchMove = (ev: TouchEvent) => {
      ev.preventDefault()
      const y = ev.touches[0].clientY
      // Re-fetch rects each move so scroll-adjusted positions are accurate
      if (listRef.current) {
        itemRectsRef.current = Array.from(listRef.current.children).map(
          (el) => (el as HTMLElement).getBoundingClientRect()
        )
      }
      const rects = itemRectsRef.current
      let overIndex = touchDragIndexRef.current ?? 0
      for (let i = 0; i < rects.length; i++) {
        if (y < rects[i].top + rects[i].height / 2) {
          overIndex = i
          break
        }
        overIndex = i
      }
      dragOverIndexRef.current = overIndex
      setDragOverIndex(overIndex)
    }

    const onTouchEnd = () => {
      document.removeEventListener('touchmove', onTouchMove)
      document.removeEventListener('touchend', onTouchEnd)
      const from = touchDragIndexRef.current
      const to = dragOverIndexRef.current
      if (from !== null && to !== null && from !== to) {
        setItems((prev) => {
          const next = [...prev]
          const [removed] = next.splice(from, 1)
          next.splice(to, 0, removed)
          return next
        })
      }
      touchDragIndexRef.current = null
      dragOverIndexRef.current = null
      setDragOverIndex(null)
    }

    document.addEventListener('touchmove', onTouchMove, { passive: false })
    document.addEventListener('touchend', onTouchEnd)
  }, [])

  // ── Submit ───────────────────────────────────────────────────────────────────

  const handleSubmit = useCallback(() => {
    const itemResults: ItemResult[] = items.map((item, placedIdx) => ({
      chunkId: item.id,
      text: item.text,
      isCorrect: item.orderIndex === placedIdx,
      placedPosition: placedIdx,
      correctPosition: item.orderIndex,
    }))

    const correctCount = itemResults.filter((r) => r.isCorrect).length
    const totalCount = items.length
    const score = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0
    const durationSeconds = Math.round((Date.now() - startTime.current.getTime()) / 1000)

    trackEvent(SORTING_GAME_COMPLETED, {
      set_id: setId,
      score,
      correct_positions: correctCount,
      total_chunks: totalCount,
      chunk_mode: chunkMode,
      duration_seconds: durationSeconds,
    })

    hapticSuccess()
    onScore?.(score)
    setResults({ correctCount, totalCount, score, itemResults })
    setSubmitted(true)
  }, [items, setId, chunkMode, onScore])

  const handleTryAgain = useCallback(() => {
    startTime.current = new Date()
    setItems(shuffle(chunks))
    setResults(null)
    setSubmitted(false)
    setDraftPositions({})
    trackEvent(SORTING_GAME_STARTED, { set_id: setId, chunk_count: chunks.length, chunk_mode: chunkMode })
  }, [chunks, setId, chunkMode])

  // ── Shared UI ────────────────────────────────────────────────────────────────

  const chunkModeSelect = (
    <Select value={chunkMode} onValueChange={(v) => onChunkModeChange(v as ChunkMode)}>
      <SelectTrigger className="h-7 w-auto gap-1 border-0 bg-transparent px-2 text-xs font-medium focus:ring-0">
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end">
        <SelectItem value="line">Line</SelectItem>
        <SelectItem value="paragraph">Paragraph</SelectItem>
        <SelectItem value="sentence">Sentence</SelectItem>
        <SelectItem value="custom">Custom (/)</SelectItem>
      </SelectContent>
    </Select>
  )

  // ── Results screen ───────────────────────────────────────────────────────────

  if (submitted && results) {
    const { correctCount, totalCount, score, itemResults } = results
    const isAllCorrect = correctCount === totalCount

    return (
      <SessionLayout
        step="Step 2"
        title="Sorting Game"
        setTitle=""
        onBack={onBack}
        contextAction={chunkModeSelect}
        showBottomActions={false}
      >
        <div className={cn(
          "flex flex-col items-center gap-3 rounded-2xl border p-6 text-center",
          isAllCorrect ? "border-green-500/30 bg-green-500/5" : "border-primary/20 bg-primary/5"
        )}>
          <div className={cn(
            "flex size-16 items-center justify-center rounded-full",
            isAllCorrect ? "bg-green-500/15" : "bg-primary/10"
          )}>
            <Trophy className={cn("size-8", isAllCorrect ? "text-green-500" : "text-primary")} />
          </div>
          <div>
            <p className="text-4xl font-bold">{score}%</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {correctCount} of {totalCount} chunk{totalCount !== 1 ? 's' : ''} in the correct position
            </p>
          </div>
          {isAllCorrect && (
            <p className="text-sm font-medium text-green-600 dark:text-green-400">Perfect order!</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          {itemResults.map((r, i) => (
            <div
              key={r.chunkId}
              className={cn(
                "flex items-start gap-3 rounded-xl border p-4",
                r.isCorrect ? "border-green-500/20 bg-green-500/5" : "border-destructive/20 bg-destructive/5"
              )}
            >
              {r.isCorrect
                ? <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-green-500" />
                : <XCircle className="mt-0.5 size-5 shrink-0 text-destructive" />
              }
              <div className="flex flex-1 flex-col gap-1">
                <p className="text-sm leading-relaxed">{r.text}</p>
                {!r.isCorrect && (
                  <p className="text-xs text-muted-foreground">
                    You placed it #{i + 1} — correct position is #{r.correctPosition + 1}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          <Button onClick={handleTryAgain} variant="outline" className="w-full gap-2">
            <RotateCcw className="size-4" />
            Try Again
          </Button>
          <Button onClick={onFinish} className="w-full">I&apos;m Done</Button>
        </div>
      </SessionLayout>
    )
  }

  // ── Reorder screen ───────────────────────────────────────────────────────────

  return (
    <SessionLayout
      step="Step 2"
      title="Sorting Game"
      setTitle=""
      onBack={onBack}
      contextAction={chunkModeSelect}
      primaryAction={{ label: 'Submit Order', onClick: handleSubmit, disabled: chunks.length === 0 }}
      secondaryAction={undefined}
    >
      <div className="rounded-lg bg-muted/50 p-3">
        <p className="text-sm text-muted-foreground">
          Drag any chunk to reorder, use the arrows, or type a position number to jump a chunk anywhere in the list.
        </p>
      </div>

      <div className="flex flex-col gap-3" ref={listRef}>
        {items.map((item, index) => {
          const activeDragIndex = dragIndexRef.current ?? touchDragIndexRef.current
          const isDragTarget = dragOverIndex === index && activeDragIndex !== index
          const draftVal = draftPositions[item.id]

          return (
            <div
              key={item.id}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              className={cn(
                "flex items-start gap-3 rounded-xl border bg-card p-4 shadow-sm transition-colors",
                isDragTarget ? "border-primary bg-primary/5 shadow-md" : ""
              )}
            >
              {/* Editable position number */}
              <div className="flex shrink-0 flex-col items-center gap-1 pt-0.5">
                <input
                  type="number"
                  min={1}
                  max={items.length}
                  value={draftVal !== undefined ? draftVal : index + 1}
                  onFocus={(e) => {
                    handlePositionFocus(item.id, index)
                    setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 350)
                  }}
                  onChange={(e) => handlePositionChange(item.id, e.target.value)}
                  onBlur={(e) => handlePositionCommit(item.id, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.currentTarget.blur()
                    }
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className={cn(
                    "w-9 rounded-lg border text-center text-sm font-semibold tabular-nums",
                    "bg-primary/10 text-primary border-primary/20",
                    "focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary",
                    "py-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  )}
                />
                <span className="text-[9px] text-muted-foreground/50 leading-none">#</span>
              </div>

              {/* Full chunk text — no clamping */}
              <p className="flex-1 text-sm leading-relaxed">{item.text}</p>

              {/* Controls */}
              <div className="flex shrink-0 flex-col items-center gap-0.5">
                <button
                  onClick={(e) => { e.stopPropagation(); handleMoveUp(index) }}
                  disabled={index === 0}
                  className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
                  aria-label="Move up"
                >
                  <ChevronUp className="size-4" />
                </button>
                <div
                  onTouchStart={(e) => handleGripTouchStart(e, index)}
                  className="flex size-7 touch-none cursor-grab items-center justify-center text-muted-foreground/40 active:text-foreground"
                >
                  <GripVertical className="size-4" />
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleMoveDown(index) }}
                  disabled={index === items.length - 1}
                  className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
                  aria-label="Move down"
                >
                  <ChevronDown className="size-4" />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </SessionLayout>
  )
}
