"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { manualIntervalDays } from "@/lib/srs"
import type { RepetitionMode, RepetitionConfig } from "@/lib/memorization-context"

interface SRToggleProps {
  mode: RepetitionMode
  config: RepetitionConfig
  onModeChange: (mode: RepetitionMode, config?: RepetitionConfig) => void
}

const MODES: { value: RepetitionMode; label: string }[] = [
  { value: "ai", label: "AI" },
  { value: "manual", label: "Manual" },
  { value: "off", label: "Off" },
]

const PERIODS: { value: "day" | "week" | "month"; label: string }[] = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
]

const PRESETS: { label: string; frequency: number; period: "day" | "week" | "month" }[] = [
  { label: "Daily", frequency: 1, period: "day" },
  { label: "2× Week", frequency: 2, period: "week" },
  { label: "3× Week", frequency: 3, period: "week" },
  { label: "Weekly", frequency: 1, period: "week" },
  { label: "Monthly", frequency: 1, period: "month" },
]

function formatInterval(frequency: number, period: "day" | "week" | "month"): string {
  const days = manualIntervalDays(frequency, period)
  if (days < 1) {
    const hours = Math.round(days * 24)
    return `every ${hours} hour${hours !== 1 ? "s" : ""}`
  }
  const rounded = Math.round(days * 10) / 10
  return `every ${rounded} day${rounded !== 1 ? "s" : ""}`
}

export function SRToggle({ mode, config, onModeChange }: SRToggleProps) {
  const [sheetOpen, setSheetOpen] = useState(false)
  const [frequency, setFrequency] = useState<number>(config.frequency ?? 3)
  const [period, setPeriod] = useState<"day" | "week" | "month">(config.period ?? "week")

  function handleModeClick(value: RepetitionMode) {
    if (value === "manual") {
      setSheetOpen(true)
      return
    }
    onModeChange(value)
  }

  function applyPreset(preset: typeof PRESETS[number]) {
    setFrequency(preset.frequency)
    setPeriod(preset.period)
  }

  function isPresetActive(preset: typeof PRESETS[number]) {
    return frequency === preset.frequency && period === preset.period
  }

  function handleManualSave() {
    onModeChange("manual", { frequency, period })
    setSheetOpen(false)
  }

  const manualLabel = mode === "manual" && config.frequency && config.period
    ? `${config.frequency}×/${config.period}`
    : null

  return (
    <>
      <div className="flex items-center justify-between gap-2 rounded-xl bg-muted/40 p-3">
        <span className="text-sm font-medium text-muted-foreground shrink-0">Spaced Repetition</span>
        <div className="flex items-center gap-0.5 rounded-lg bg-muted p-0.5">
          {MODES.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => handleModeClick(value)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-all",
                mode === value
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {value === "manual" && manualLabel ? manualLabel : label}
            </button>
          ))}
        </div>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl pb-safe">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-center">Manual Schedule</SheetTitle>
          </SheetHeader>

          <div className="flex flex-col gap-5 px-2">
            {/* Quick presets */}
            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Quick presets</p>
              <div className="flex flex-wrap gap-2">
                {PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => applyPreset(preset)}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-sm font-medium transition-all border",
                      isPresetActive(preset)
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-muted/50 text-muted-foreground hover:bg-muted"
                    )}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground">or customize</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            {/* Frequency picker */}
            <div className="flex flex-col gap-3">
              <p className="text-sm font-medium text-center text-muted-foreground">How many times?</p>
              <div className="flex items-center justify-center gap-2">
                {[1, 2, 3, 4, 5, 7].map((n) => (
                  <button
                    key={n}
                    onClick={() => setFrequency(n)}
                    className={cn(
                      "flex size-11 items-center justify-center rounded-full text-sm font-semibold transition-all",
                      frequency === n
                        ? "bg-primary text-primary-foreground shadow-md scale-105"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    )}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Period picker */}
            <div className="flex flex-col gap-3">
              <p className="text-sm font-medium text-center text-muted-foreground">Per</p>
              <div className="flex gap-2 justify-center">
                {PERIODS.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setPeriod(value)}
                    className={cn(
                      "flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all border-2",
                      period === value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-transparent bg-muted text-muted-foreground hover:bg-muted/80"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Preview */}
            <div className="rounded-xl bg-primary/5 border border-primary/10 px-4 py-3 text-center">
              <p className="text-sm font-semibold text-primary">
                Practice {formatInterval(frequency, period)}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {frequency}× per {period}
              </p>
            </div>

            <Button onClick={handleManualSave} className="w-full" size="lg">
              Save Schedule
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
