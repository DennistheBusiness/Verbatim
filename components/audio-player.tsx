"use client"

import { useState, useRef, useEffect } from "react"
import { Play, Pause, Volume2, Download, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { toast } from "sonner"

interface AudioPlayerProps {
  audioUrl: string
  filename?: string
  onDelete?: () => void
  compact?: boolean
}

export function AudioPlayer({ 
  audioUrl, 
  filename = "recording.webm", 
  onDelete,
  compact = false 
}: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [showVolume, setShowVolume] = useState(false)
  
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const updateTime = () => setCurrentTime(audio.currentTime)
    const updateDuration = () => setDuration(audio.duration)
    const handleEnded = () => setIsPlaying(false)

    audio.addEventListener("timeupdate", updateTime)
    audio.addEventListener("loadedmetadata", updateDuration)
    audio.addEventListener("ended", handleEnded)

    return () => {
      audio.removeEventListener("timeupdate", updateTime)
      audio.removeEventListener("loadedmetadata", updateDuration)
      audio.removeEventListener("ended", handleEnded)
    }
  }, [])

  const togglePlay = () => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
    } else {
      audio.play()
    }
    setIsPlaying(!isPlaying)
  }

  const handleSeek = (value: number[]) => {
    const audio = audioRef.current
    if (!audio) return

    const newTime = value[0]
    audio.currentTime = newTime
    setCurrentTime(newTime)
  }

  const handleVolumeChange = (value: number[]) => {
    const audio = audioRef.current
    if (!audio) return

    const newVolume = value[0]
    audio.volume = newVolume
    setVolume(newVolume)
  }

  const handleDownload = () => {
    const link = document.createElement("a")
    link.href = audioUrl
    link.download = filename
    link.click()
    toast.success("Download started")
  }

  const handleDelete = () => {
    if (onDelete) {
      onDelete()
      toast.success("Recording deleted")
    }
  }

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return "0:00"
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  // Compact mode for list views
  if (compact) {
    return (
      <Card className="p-3">
        <audio ref={audioRef} src={audioUrl} preload="metadata" />
        <div className="flex items-center gap-3">
          <Button
            size="icon"
            variant="outline"
            onClick={togglePlay}
            className="shrink-0"
          >
            {isPlaying ? <Pause className="size-4" /> : <Play className="size-4" />}
          </Button>

          <div className="flex-1 space-y-1">
            <Slider
              value={[currentTime]}
              max={duration || 100}
              step={0.1}
              onValueChange={handleSeek}
              className="cursor-pointer"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          <div className="flex gap-1 shrink-0">
            <Button size="icon" variant="ghost" onClick={handleDownload}>
              <Download className="size-4" />
            </Button>
            {onDelete && (
              <Button size="icon" variant="ghost" onClick={handleDelete}>
                <Trash2 className="size-4" />
              </Button>
            )}
          </div>
        </div>
      </Card>
    )
  }

  // Full mode for detail views
  return (
    <Card className="p-6">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
      
      <div className="space-y-4">
        {/* Title */}
        {filename && (
          <div className="flex items-center justify-between">
            <p className="font-medium truncate">{filename}</p>
            <p className="text-sm text-muted-foreground">{formatTime(duration)}</p>
          </div>
        )}

        {/* Waveform placeholder / Progress bar */}
        <div className="space-y-2">
          <Slider
            value={[currentTime]}
            max={duration || 100}
            step={0.1}
            onValueChange={handleSeek}
            className="cursor-pointer"
          />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              size="lg"
              onClick={togglePlay}
              className="gap-2"
            >
              {isPlaying ? (
                <>
                  <Pause className="size-5" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="size-5" />
                  Play
                </>
              )}
            </Button>

            {/* Volume control */}
            <div className="relative">
              <Button
                size="icon"
                variant="outline"
                onClick={() => setShowVolume(!showVolume)}
                onMouseEnter={() => setShowVolume(true)}
              >
                <Volume2 className="size-4" />
              </Button>
              
              {showVolume && (
                <div
                  className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-3 bg-popover border rounded-md shadow-md z-10"
                  onMouseLeave={() => setShowVolume(false)}
                >
                  <div className="h-24 flex items-center">
                    <Slider
                      value={[volume]}
                      max={1}
                      step={0.1}
                      onValueChange={handleVolumeChange}
                      orientation="vertical"
                      className="h-full cursor-pointer"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleDownload}
              className="gap-2"
            >
              <Download className="size-4" />
              <span className="hidden sm:inline">Download</span>
            </Button>
            {onDelete && (
              <Button
                variant="outline"
                onClick={handleDelete}
                className="gap-2 text-destructive hover:text-destructive"
              >
                <Trash2 className="size-4" />
                <span className="hidden sm:inline">Delete</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}
