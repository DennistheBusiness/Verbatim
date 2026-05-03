"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Volume2, VolumeX, Pause, Play, RotateCcw, RotateCw, X, Loader2 } from "lucide-react"
import { toast } from "sonner"

const SPEED_OPTIONS = ["0.5", "0.75", "1", "1.25", "1.5", "2"]
const VOICE_STORAGE_KEY = "verbatim-tts-voice-groq"
const WORDS_PER_SECOND = 2.5 // estimate for duration display before audio loads

const VOICES = [
  { id: "autumn", label: "Autumn", description: "Female" },
  { id: "diana",  label: "Diana",  description: "Female" },
  { id: "hannah", label: "Hannah", description: "Female" },
  { id: "austin", label: "Austin", description: "Male"   },
  { id: "daniel", label: "Daniel", description: "Male"   },
  { id: "troy",   label: "Troy",   description: "Male"   },
] as const

type VoiceId = typeof VOICES[number]["id"]
type TtsState = "idle" | "generating" | "playing" | "paused"

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || isNaN(seconds) || seconds < 0) return "0:00"
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, "0")}`
}

interface TextToSpeechPlayerProps {
  content: string
  onClose: () => void
}

export function TextToSpeechPlayer({ content, onClose }: TextToSpeechPlayerProps) {
  const [ttsState, setTtsState] = useState<TtsState>("idle")
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [speed, setSpeed] = useState("1")
  const [isMuted, setIsMuted] = useState(false)
  const [selectedVoice, setSelectedVoice] = useState<VoiceId>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(VOICE_STORAGE_KEY)
      if (saved && VOICES.some(v => v.id === saved)) return saved as VoiceId
    }
    return "autumn"
  })

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const blobCacheRef = useRef<{ key: string; url: string } | null>(null)
  const isGeneratingRef = useRef(false)

  const words = useMemo(() => content.split(/(\s+)/), [content])

  // Word index derived from real audio currentTime once loaded, estimated before
  const currentWordIndex = useMemo(() => {
    if (ttsState === "idle" || ttsState === "generating") return -1
    const d = duration > 0 ? duration : words.filter(w => !/^\s+$/.test(w)).length / WORDS_PER_SECOND
    if (d <= 0) return -1
    return Math.floor((currentTime / d) * words.length)
  }, [currentTime, duration, words, ttsState])

  const displayDuration = duration > 0
    ? duration
    : words.filter(w => !/^\s+$/.test(w)).length / WORDS_PER_SECOND

  const cacheKey = `${selectedVoice}::${content}`

  const generateAudio = async (seekTo?: number) => {
    if (isGeneratingRef.current) return
    isGeneratingRef.current = true
    setTtsState("generating")
    setCurrentTime(0)
    setDuration(0)

    try {
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: content, voice: selectedVoice }),
      })

      if (!response.ok) {
        const data: { error?: string } = await response.json().catch(() => ({}))
        toast.error(data.error ?? "TTS generation failed. Please try again.")
        setTtsState("idle")
        return
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)

      if (blobCacheRef.current) URL.revokeObjectURL(blobCacheRef.current.url)
      blobCacheRef.current = { key: cacheKey, url }

      const audio = audioRef.current!
      audio.src = url
      audio.playbackRate = parseFloat(speed)
      audio.muted = isMuted
      if (seekTo !== undefined) audio.currentTime = seekTo
      await audio.play()
      setTtsState("playing")
    } catch (err) {
      console.error("[TTS]", err)
      toast.error("TTS generation failed. Please try again.")
      setTtsState("idle")
    } finally {
      isGeneratingRef.current = false
    }
  }

  const handlePlay = async () => {
    if (isGeneratingRef.current) return

    if (ttsState === "paused" && audioRef.current) {
      audioRef.current.play()
      setTtsState("playing")
      return
    }

    // Re-play cached audio (e.g. after it ended)
    if (blobCacheRef.current?.key === cacheKey && audioRef.current?.src) {
      audioRef.current.currentTime = 0
      audioRef.current.playbackRate = parseFloat(speed)
      audioRef.current.muted = isMuted
      audioRef.current.play()
      setTtsState("playing")
      return
    }

    await generateAudio()
  }

  const handlePause = () => {
    audioRef.current?.pause()
    setTtsState("paused")
  }

  const handleSeek = (value: number[]) => {
    const t = value[0]
    if (audioRef.current) audioRef.current.currentTime = t
    setCurrentTime(t)
  }

  const skipSeconds = (seconds: number) => {
    if (!audioRef.current) return
    const newTime = Math.max(0, Math.min(duration || displayDuration, currentTime + seconds))
    audioRef.current.currentTime = newTime
    setCurrentTime(newTime)
  }

  const handleWordClick = async (index: number) => {
    if (/^\s+$/.test(words[index])) return
    const seekTo = displayDuration > 0 ? (index / words.length) * displayDuration : undefined

    if (blobCacheRef.current?.key === cacheKey && audioRef.current?.src) {
      if (seekTo !== undefined) audioRef.current.currentTime = seekTo
      if (ttsState !== "playing") {
        audioRef.current.play()
        setTtsState("playing")
      }
    } else {
      await generateAudio(seekTo)
    }
  }

  const handleSpeedChange = (val: string) => {
    setSpeed(val)
    if (audioRef.current) audioRef.current.playbackRate = parseFloat(val)
  }

  const handleVoiceChange = (voiceId: VoiceId) => {
    setSelectedVoice(voiceId)
    localStorage.setItem(VOICE_STORAGE_KEY, voiceId)
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ""
    }
    setTtsState("idle")
    setCurrentTime(0)
    setDuration(0)
  }

  const toggleMute = () => {
    const newMuted = !isMuted
    setIsMuted(newMuted)
    if (audioRef.current) audioRef.current.muted = newMuted
  }

  useEffect(() => {
    return () => {
      audioRef.current?.pause()
      if (blobCacheRef.current) URL.revokeObjectURL(blobCacheRef.current.url)
    }
  }, [])

  const isGenerating = ttsState === "generating"
  const isPlaying = ttsState === "playing"
  const isPaused = ttsState === "paused"
  const isActive = isPlaying || isPaused

  return (
    <Card className="border-purple-500/20 bg-purple-500/5">
      {/* Hidden audio element driven by the Groq TTS blob */}
      <audio
        ref={audioRef}
        onTimeUpdate={() => audioRef.current && setCurrentTime(audioRef.current.currentTime)}
        onLoadedMetadata={() => audioRef.current && setDuration(audioRef.current.duration)}
        onEnded={() => { setTtsState("idle"); setCurrentTime(0) }}
      />
      <CardContent className="flex flex-col gap-4 py-4">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Volume2 className="size-4 text-purple-600 dark:text-purple-400" />
            <h3 className="text-sm font-medium">AI Read Aloud</h3>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={onClose}>
            <X className="size-4" />
          </Button>
        </div>

        {/* Voice + Speed row */}
        <div className="flex gap-2">
          <Select value={selectedVoice} onValueChange={(v) => handleVoiceChange(v as VoiceId)}>
            <SelectTrigger className="flex-1 h-8 text-xs">
              <SelectValue placeholder="Voice" />
            </SelectTrigger>
            <SelectContent>
              {VOICES.map((v) => (
                <SelectItem key={v.id} value={v.id} className="text-xs">
                  {v.label}
                  <span className="text-muted-foreground ml-1">({v.description})</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={speed} onValueChange={handleSpeedChange}>
            <SelectTrigger className="h-8 w-[68px] text-xs px-2 shrink-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SPEED_OPTIONS.map((s) => (
                <SelectItem key={s} value={s} className="text-xs">{s}×</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Content with word highlighting */}
        <div className="max-h-[280px] overflow-y-auto rounded-md border bg-background/50 p-4">
          <p className="whitespace-pre-wrap text-sm leading-7">
            {words.map((word, index) => {
              const isWord = !/^\s+$/.test(word)
              const active = index === currentWordIndex && isWord
              return (
                <span
                  key={index}
                  onClick={isWord ? () => handleWordClick(index) : undefined}
                  className={
                    active
                      ? "bg-purple-200 dark:bg-purple-900/50 text-purple-900 dark:text-purple-100 rounded px-0.5 cursor-pointer"
                      : isWord
                      ? "rounded px-0.5 cursor-pointer hover:bg-purple-100 dark:hover:bg-purple-900/20 transition-colors"
                      : ""
                  }
                >
                  {word}
                </span>
              )
            })}
          </p>
        </div>

        {/* Playback controls */}
        <div className="flex items-center gap-2 rounded-xl border bg-background px-3 py-2.5">
          <Button
            variant="ghost" size="icon"
            onClick={() => skipSeconds(-15)}
            disabled={!isActive}
            className="size-8 shrink-0"
          >
            <div className="flex flex-col items-center gap-0">
              <RotateCcw className="size-3.5" />
              <span className="text-[8px] font-semibold leading-none">15</span>
            </div>
          </Button>

          {isGenerating ? (
            <Button variant="default" size="icon" disabled className="size-10 shrink-0 rounded-full">
              <Loader2 className="size-4 animate-spin" />
            </Button>
          ) : isPlaying ? (
            <Button variant="default" size="icon" onClick={handlePause} className="size-10 shrink-0 rounded-full">
              <Pause className="size-4" />
            </Button>
          ) : (
            <Button variant="default" size="icon" onClick={handlePlay} className="size-10 shrink-0 rounded-full">
              <Play className="size-4" />
            </Button>
          )}

          <Button
            variant="ghost" size="icon"
            onClick={() => skipSeconds(15)}
            disabled={!isActive}
            className="size-8 shrink-0"
          >
            <div className="flex flex-col items-center gap-0">
              <RotateCw className="size-3.5" />
              <span className="text-[8px] font-semibold leading-none">15</span>
            </div>
          </Button>

          <span className="w-9 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
            {formatTime(currentTime)}
          </span>

          <Slider
            min={0}
            max={displayDuration || 1}
            step={0.5}
            value={[currentTime]}
            onValueChange={handleSeek}
            disabled={isGenerating || ttsState === "idle"}
            className="flex-1"
          />

          <span className="w-9 shrink-0 text-xs tabular-nums text-muted-foreground">
            {formatTime(displayDuration)}
          </span>

          <Button variant="ghost" size="icon" onClick={toggleMute} className="size-8 shrink-0">
            {isMuted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          {isGenerating ? "Generating audio…" : isPaused ? "Paused" : isPlaying ? "Reading…" : "Ready · tap play for AI voice"}
        </p>
      </CardContent>
    </Card>
  )
}
