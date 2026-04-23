"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Volume2, VolumeX, Pause, Play, RotateCcw, X } from "lucide-react"
import { toast } from "sonner"

interface TextToSpeechPlayerProps {
  content: string
  onClose: () => void
}

export function TextToSpeechPlayer({ content, onClose }: TextToSpeechPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [currentWordIndex, setCurrentWordIndex] = useState(-1)
  const [rate, setRate] = useState(1.0)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const wordsRef = useRef<string[]>([])

  // Split content into words for highlighting
  useEffect(() => {
    wordsRef.current = content.split(/(\s+)/)
  }, [content])

  const speak = () => {
    if (isPaused && utteranceRef.current) {
      window.speechSynthesis.resume()
      setIsPaused(false)
      setIsPlaying(true)
      return
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(content)
    utterance.rate = rate
    utterance.pitch = 1
    utterance.volume = 1

    // Word boundary event for highlighting (may not work in all browsers)
    utterance.onboundary = (event) => {
      if (event.name === 'word') {
        const charIndex = event.charIndex
        let wordIndex = 0
        let charCount = 0
        
        for (let i = 0; i < wordsRef.current.length; i++) {
          charCount += wordsRef.current[i].length
          if (charCount > charIndex) {
            wordIndex = i
            break
          }
        }
        
        setCurrentWordIndex(wordIndex)
      }
    }

    utterance.onstart = () => {
      setIsPlaying(true)
      setIsPaused(false)
    }

    utterance.onend = () => {
      setIsPlaying(false)
      setIsPaused(false)
      setCurrentWordIndex(-1)
    }

    utterance.onerror = () => {
      setIsPlaying(false)
      setIsPaused(false)
      setCurrentWordIndex(-1)
      toast.error('Text-to-speech failed')
    }

    utteranceRef.current = utterance
    window.speechSynthesis.speak(utterance)
  }

  const pause = () => {
    window.speechSynthesis.pause()
    setIsPaused(true)
    setIsPlaying(false)
  }

  const stop = () => {
    window.speechSynthesis.cancel()
    setIsPlaying(false)
    setIsPaused(false)
    setCurrentWordIndex(-1)
  }

  const restart = () => {
    stop()
    setTimeout(() => speak(), 100)
  }

  const handleRateChange = (value: number[]) => {
    const newRate = value[0]
    setRate(newRate)
    if (isPlaying && utteranceRef.current) {
      // Restart with new rate
      const wasPlaying = isPlaying
      stop()
      if (wasPlaying) {
        setTimeout(() => speak(), 100)
      }
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel()
    }
  }, [])

  return (
    <Card className="border-purple-500/20 bg-purple-500/5">
      <CardContent className="flex flex-col gap-4 py-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Volume2 className="size-4 text-purple-600 dark:text-purple-400" />
            <h3 className="text-sm font-medium text-foreground">Text-to-Speech Player</h3>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
          >
            <X className="size-4" />
          </Button>
        </div>

        {/* Content with highlighting */}
        <div className="max-h-[300px] overflow-y-auto rounded-md border bg-background/50 p-4">
          <p className="whitespace-pre-wrap text-base leading-7">
            {wordsRef.current.map((word, index) => {
              const isCurrentWord = index === currentWordIndex
              const isWhitespace = /^\s+$/.test(word)
              
              return (
                <span
                  key={index}
                  className={`${
                    isCurrentWord && !isWhitespace
                      ? 'bg-purple-200 dark:bg-purple-900/50 text-purple-900 dark:text-purple-100 rounded px-0.5'
                      : ''
                  }`}
                >
                  {word}
                </span>
              )
            })}
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-col gap-3">
          {/* Playback controls */}
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={restart}
              disabled={!isPlaying && !isPaused}
            >
              <RotateCcw className="size-4" />
            </Button>
            
            {isPlaying ? (
              <Button
                variant="default"
                size="icon"
                onClick={pause}
                className="size-12"
              >
                <Pause className="size-5" />
              </Button>
            ) : (
              <Button
                variant="default"
                size="icon"
                onClick={speak}
                className="size-12"
              >
                <Play className="size-5" />
              </Button>
            )}

            <Button
              variant="outline"
              size="icon"
              onClick={stop}
              disabled={!isPlaying && !isPaused}
            >
              <VolumeX className="size-4" />
            </Button>
          </div>

          {/* Speed control */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Speed</span>
              <span>{rate.toFixed(1)}x</span>
            </div>
            <Slider
              value={[rate]}
              onValueChange={handleRateChange}
              min={0.5}
              max={2}
              step={0.1}
              className="w-full"
            />
          </div>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          {isPaused ? 'Paused' : isPlaying ? 'Reading...' : 'Ready to read'}
        </p>
      </CardContent>
    </Card>
  )
}
