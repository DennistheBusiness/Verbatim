"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Volume2, VolumeX, Pause, Play, RotateCcw, RotateCw, X } from "lucide-react"
import { toast } from "sonner"

const SPEED_OPTIONS = ["0.5", "0.75", "1", "1.25", "1.5", "2"]
const VOICE_STORAGE_KEY = "verbatim-tts-voice"
const WORDS_PER_SECOND = 2.5 // average spoken words/sec at 1× speed

// Curated priority list — best voices across macOS, Windows, and Chrome
const PREFERRED_VOICE_NAMES = [
  "Samantha",               // macOS — natural American English
  "Google US English",      // Chrome — American English
  "Microsoft Zira",         // Windows — female American English
  "Microsoft David",        // Windows — male American English
  "Alex",                   // macOS — classic American English
  "Daniel",                 // macOS — British English
  "Google UK English Female",
  "Google UK English Male",
  "Microsoft Mark",
  "Karen",                  // macOS — Australian English
]

function pickBestVoices(all: SpeechSynthesisVoice[]): SpeechSynthesisVoice[] {
  const english = all.filter(v => v.lang.startsWith("en"))
  const preferred: SpeechSynthesisVoice[] = []
  for (const name of PREFERRED_VOICE_NAMES) {
    const match = english.find(v => v.name === name)
    if (match) preferred.push(match)
    if (preferred.length === 5) break
  }
  if (preferred.length < 5) {
    const usVoices = english
      .filter(v => v.lang === "en-US" && !preferred.includes(v))
      .sort((a, b) => a.name.localeCompare(b.name))
    preferred.push(...usVoices.slice(0, 5 - preferred.length))
  }
  return preferred.slice(0, 5)
}

interface TextToSpeechPlayerProps {
  content: string
  onClose: () => void
}

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || isNaN(seconds) || seconds < 0) return "0:00"
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, "0")}`
}

export function TextToSpeechPlayer({ content, onClose }: TextToSpeechPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [currentWordIndex, setCurrentWordIndex] = useState(-1)
  const [speed, setSpeed] = useState("1")
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>("")
  const [isMuted, setIsMuted] = useState(false)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const wordsRef = useRef<string[]>([])
  const isMutedRef = useRef(false)
  const currentWordIndexRef = useRef(-1)

  useEffect(() => { currentWordIndexRef.current = currentWordIndex }, [currentWordIndex])

  useEffect(() => {
    wordsRef.current = content.split(/(\s+)/)
  }, [content])

  // Load voices — Chrome fires onvoiceschanged, others return synchronously
  useEffect(() => {
    const loadVoices = () => {
      const all = window.speechSynthesis.getVoices()
      const best = pickBestVoices(all)
      setVoices(best)
      const saved = localStorage.getItem(VOICE_STORAGE_KEY)
      const match = best.find((v) => v.voiceURI === saved)
      setSelectedVoiceURI(match?.voiceURI ?? best[0]?.voiceURI ?? "")
    }
    loadVoices()
    window.speechSynthesis.onvoiceschanged = loadVoices
    return () => { window.speechSynthesis.onvoiceschanged = null }
  }, [])

  // Estimated timing based on word count + speed
  const { estimatedDuration, estimatedCurrentTime } = useMemo(() => {
    const words = wordsRef.current
    const realWordCount = words.filter(w => !/^\s+$/.test(w)).length
    const rate = parseFloat(speed)
    const duration = realWordCount / (WORDS_PER_SECOND * rate)
    if (currentWordIndex < 0) return { estimatedDuration: duration, estimatedCurrentTime: 0 }
    const elapsed = (currentWordIndex / Math.max(words.length - 1, 1)) * duration
    return { estimatedDuration: duration, estimatedCurrentTime: elapsed }
  }, [currentWordIndex, speed])

  const handleVoiceChange = (uri: string) => {
    setSelectedVoiceURI(uri)
    localStorage.setItem(VOICE_STORAGE_KEY, uri)
    if (isPlaying || isPaused) restart()
  }

  const startFromWord = (fromWordIndex: number) => {
    window.speechSynthesis.cancel()
    const slicedWords = wordsRef.current.slice(fromWordIndex)
    const text = slicedWords.join("")

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = parseFloat(speed)
    utterance.pitch = 1
    utterance.volume = isMutedRef.current ? 0 : 1

    const voice = voices.find((v) => v.voiceURI === selectedVoiceURI)
    if (voice) utterance.voice = voice

    utterance.onboundary = (event) => {
      if (event.name === "word") {
        const charIndex = event.charIndex
        let localIndex = 0
        let charCount = 0
        for (let i = 0; i < slicedWords.length; i++) {
          charCount += slicedWords[i].length
          if (charCount > charIndex) { localIndex = i; break }
        }
        setCurrentWordIndex(fromWordIndex + localIndex)
      }
    }

    utterance.onstart = () => { setIsPlaying(true); setIsPaused(false) }
    utterance.onend = () => { setIsPlaying(false); setIsPaused(false); setCurrentWordIndex(-1) }
    utterance.onerror = (e) => {
      if (e.error === "interrupted") return
      setIsPlaying(false); setIsPaused(false); setCurrentWordIndex(-1)
      toast.error("Text-to-speech failed")
    }

    utteranceRef.current = utterance
    window.speechSynthesis.speak(utterance)
  }

  const speak = () => {
    if (isPaused && utteranceRef.current) {
      window.speechSynthesis.resume()
      setIsPaused(false)
      setIsPlaying(true)
      return
    }
    startFromWord(0)
  }

  const handleWordClick = (index: number) => {
    if (/^\s+$/.test(wordsRef.current[index])) return
    startFromWord(index)
  }

  const pause = () => { window.speechSynthesis.pause(); setIsPaused(true); setIsPlaying(false) }
  const stop = () => { window.speechSynthesis.cancel(); setIsPlaying(false); setIsPaused(false); setCurrentWordIndex(-1) }
  const restart = () => { stop(); setTimeout(() => speak(), 100) }

  const skipSeconds = (seconds: number) => {
    const words = wordsRef.current
    const rate = parseFloat(speed)
    const realWordCount = words.filter(w => !/^\s+$/.test(w)).length
    const duration = realWordCount / (WORDS_PER_SECOND * rate)
    const tokensPerSecond = words.length / Math.max(duration, 0.1)
    const tokensToSkip = Math.round(Math.abs(seconds) * tokensPerSecond)
    const current = currentWordIndexRef.current < 0 ? 0 : currentWordIndexRef.current
    const newIndex = seconds > 0
      ? Math.min(current + tokensToSkip, words.length - 1)
      : Math.max(current - tokensToSkip, 0)
    startFromWord(newIndex)
  }

  const handleSeek = (value: number[]) => {
    const t = value[0]
    const words = wordsRef.current
    const targetIndex = Math.round((t / Math.max(estimatedDuration, 0.1)) * (words.length - 1))
    startFromWord(Math.max(0, Math.min(targetIndex, words.length - 1)))
  }

  const toggleMute = () => {
    const newMuted = !isMuted
    setIsMuted(newMuted)
    isMutedRef.current = newMuted
    if (isPlaying) startFromWord(currentWordIndexRef.current < 0 ? 0 : currentWordIndexRef.current)
  }

  const handleSpeedChange = (val: string) => {
    setSpeed(val)
    if (isPlaying || isPaused) { stop(); setTimeout(() => speak(), 100) }
  }

  useEffect(() => () => { window.speechSynthesis.cancel() }, [])

  return (
    <Card className="border-purple-500/20 bg-purple-500/5">
      <CardContent className="flex flex-col gap-4 py-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Volume2 className="size-4 text-purple-600 dark:text-purple-400" />
            <h3 className="text-sm font-medium">Text-to-Speech</h3>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={onClose}>
            <X className="size-4" />
          </Button>
        </div>

        {/* Voice + Speed row */}
        <div className="flex gap-2">
          {voices.length > 0 && (
            <Select value={selectedVoiceURI} onValueChange={handleVoiceChange}>
              <SelectTrigger className="flex-1 h-8 text-xs">
                <SelectValue placeholder="Voice" />
              </SelectTrigger>
              <SelectContent>
                {voices.map((v) => (
                  <SelectItem key={v.voiceURI} value={v.voiceURI} className="text-xs">
                    {v.name} <span className="text-muted-foreground ml-1">({v.lang})</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
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
            {wordsRef.current.map((word, index) => {
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

        {/* Full audio player controls */}
        <div className="flex items-center gap-2 rounded-xl border bg-background px-3 py-2.5">
          {/* Skip back 15s */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => skipSeconds(-15)}
            disabled={!isPlaying && !isPaused}
            className="size-8 shrink-0"
          >
            <div className="flex flex-col items-center gap-0">
              <RotateCcw className="size-3.5" />
              <span className="text-[8px] font-semibold leading-none">15</span>
            </div>
          </Button>

          {/* Play / Pause — large */}
          {isPlaying ? (
            <Button variant="default" size="icon" onClick={pause} className="size-10 shrink-0 rounded-full">
              <Pause className="size-4" />
            </Button>
          ) : (
            <Button variant="default" size="icon" onClick={speak} className="size-10 shrink-0 rounded-full">
              <Play className="size-4" />
            </Button>
          )}

          {/* Skip forward 15s */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => skipSeconds(15)}
            disabled={!isPlaying && !isPaused}
            className="size-8 shrink-0"
          >
            <div className="flex flex-col items-center gap-0">
              <RotateCw className="size-3.5" />
              <span className="text-[8px] font-semibold leading-none">15</span>
            </div>
          </Button>

          {/* Current time */}
          <span className="w-9 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
            {formatTime(estimatedCurrentTime)}
          </span>

          {/* Scrub slider */}
          <Slider
            min={0}
            max={estimatedDuration || 1}
            step={0.5}
            value={[estimatedCurrentTime]}
            onValueChange={handleSeek}
            className="flex-1"
          />

          {/* Duration */}
          <span className="w-9 shrink-0 text-xs tabular-nums text-muted-foreground">
            {formatTime(estimatedDuration)}
          </span>

          {/* Mute */}
          <Button variant="ghost" size="icon" onClick={toggleMute} className="size-8 shrink-0">
            {isMuted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          {isPaused ? "Paused" : isPlaying ? "Reading…" : "Ready to read"}
        </p>
      </CardContent>
    </Card>
  )
}
