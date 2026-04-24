"use client"

import { useRef, useState, useEffect, useCallback } from "react"
import { Play, Pause } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { TranscriptWord } from "@/app/api/transcribe/route"

interface TimedAudioPlayerProps {
  audioUrl: string
  transcript?: string | null
  transcriptWords?: TranscriptWord[] | null
}

const SPEED_OPTIONS = ["0.5", "0.75", "1", "1.25", "1.5", "2"]

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || isNaN(seconds)) return "0:00"
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, "0")}`
}

export function TimedAudioPlayer({ audioUrl, transcript, transcriptWords }: TimedAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([])
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [speed, setSpeed] = useState("1")
  const [activeWordIndex, setActiveWordIndex] = useState(-1)

  const words = transcriptWords && transcriptWords.length > 0 ? transcriptWords : null

  // Sync active word index to currentTime
  useEffect(() => {
    if (!words) return
    const idx = words.findIndex((w, i) => {
      const end = words[i + 1]?.start ?? w.end + 0.5
      return currentTime >= w.start && currentTime < end
    })
    setActiveWordIndex(idx)
    if (idx >= 0 && wordRefs.current[idx]) {
      wordRefs.current[idx]?.scrollIntoView({ block: "nearest", behavior: "smooth" })
    }
  }, [currentTime, words])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const onTimeUpdate = () => setCurrentTime(audio.currentTime)
    const onLoaded = () => setDuration(audio.duration)
    const onEnded = () => setIsPlaying(false)

    audio.addEventListener("timeupdate", onTimeUpdate)
    audio.addEventListener("loadedmetadata", onLoaded)
    audio.addEventListener("ended", onEnded)
    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate)
      audio.removeEventListener("loadedmetadata", onLoaded)
      audio.removeEventListener("ended", onEnded)
    }
  }, [])

  const togglePlay = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    if (isPlaying) {
      audio.pause()
      setIsPlaying(false)
    } else {
      audio.play()
      setIsPlaying(true)
    }
  }, [isPlaying])

  const handleSeek = (value: number[]) => {
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = value[0]
    setCurrentTime(value[0])
  }

  const handleSpeedChange = (val: string) => {
    const audio = audioRef.current
    if (!audio) return
    setSpeed(val)
    audio.playbackRate = parseFloat(val)
  }

  const seekToWord = (word: TranscriptWord) => {
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = word.start
    setCurrentTime(word.start)
    if (!isPlaying) {
      audio.play()
      setIsPlaying(true)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      {/* Controls row */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={togglePlay}
          className="shrink-0 size-9 rounded-full"
        >
          {isPlaying ? <Pause className="size-4" /> : <Play className="size-4" />}
        </Button>

        <div className="flex items-center gap-2 text-xs text-muted-foreground tabular-nums shrink-0">
          <span>{formatTime(currentTime)}</span>
          <span>/</span>
          <span>{formatTime(duration)}</span>
        </div>

        <Slider
          min={0}
          max={duration || 1}
          step={0.1}
          value={[currentTime]}
          onValueChange={handleSeek}
          className="flex-1"
        />

        <Select value={speed} onValueChange={handleSpeedChange}>
          <SelectTrigger className="h-7 w-[64px] text-xs px-2">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SPEED_OPTIONS.map((s) => (
              <SelectItem key={s} value={s} className="text-xs">
                {s}×
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Transcript */}
      {words ? (
        <div className="max-h-48 overflow-y-auto rounded-xl border bg-muted/30 p-4 text-sm leading-relaxed">
          {words.map((w, i) => (
            <span
              key={i}
              ref={(el) => { wordRefs.current[i] = el }}
              onClick={() => seekToWord(w)}
              className={`cursor-pointer rounded px-0.5 transition-colors ${
                i === activeWordIndex
                  ? "bg-primary/20 text-primary font-medium"
                  : "hover:bg-muted-foreground/10"
              }`}
            >
              {w.word}{" "}
            </span>
          ))}
        </div>
      ) : transcript ? (
        <div className="max-h-48 overflow-y-auto rounded-xl border bg-muted/30 p-4 text-sm leading-relaxed text-muted-foreground">
          {transcript}
        </div>
      ) : null}
    </div>
  )
}
