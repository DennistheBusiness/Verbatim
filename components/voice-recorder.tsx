"use client"

import { useState, useRef, useEffect } from "react"
import { Mic, Square, Pause, Play, Trash2, Check, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { FieldDescription } from "@/components/ui/field"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"
import type { TranscriptWord } from "@/app/api/transcribe/route"

interface VoiceRecorderProps {
  onRecordingComplete: (audioBlob: Blob, transcription: string, transcriptWords: TranscriptWord[]) => void
}

type RecordingState = "idle" | "recording" | "paused" | "stopped" | "transcribing"

// Check if browser supports required APIs
const isWebSpeechSupported = 
  typeof window !== "undefined" && 
  ("webkitSpeechRecognition" in window || "SpeechRecognition" in window)

const isMediaRecorderSupported = 
  typeof window !== "undefined" && 
  "MediaRecorder" in window

export function VoiceRecorder({ onRecordingComplete }: VoiceRecorderProps) {
  const [state, setState] = useState<RecordingState>("idle")
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string>("")
  const [transcription, setTranscription] = useState("")
  const [transcriptWords, setTranscriptWords] = useState<TranscriptWord[]>([])
  const [duration, setDuration] = useState(0)
  const [error, setError] = useState("")
  const [permissionDenied, setPermissionDenied] = useState(false)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const recognitionRef = useRef<any>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | null>(null)

  useEffect(() => {
    // Initialize Speech Recognition
    if (isWebSpeechSupported) {
      const SpeechRecognition = 
        (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
      
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = true
      recognitionRef.current.interimResults = true
      recognitionRef.current.lang = "en-US"

      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = ""
        let interimTranscript = ""

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcript + " "
          } else {
            interimTranscript += transcript
          }
        }

        if (finalTranscript) {
          setTranscription((prev) => prev + finalTranscript)
        }
      }

      recognitionRef.current.onerror = (event: any) => {
        // service-not-allowed fires in WKWebView (iOS native) — Web Speech is blocked there
        // but Groq handles transcription anyway, so this is silent
        if (event.error === "no-speech" || event.error === "service-not-allowed" || event.error === "not-allowed") {
          return
        }
        console.error("Speech recognition error:", event.error)
        toast.error(`Transcription error: ${event.error}`)
      }
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch (e) {
          // Ignore errors on cleanup
        }
      }
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [])

  // Auto-stop at 1-hour limit
  useEffect(() => {
    if (duration >= 3600 && (state === "recording" || state === "paused")) {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop()
        try { recognitionRef.current?.stop() } catch {}
        setState("stopped")
      }
      if (timerRef.current) clearInterval(timerRef.current)
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
      toast.warning("1 hour limit reached. Recording saved automatically.")
    }
  }, [duration]) // eslint-disable-line react-hooks/exhaustive-deps

  const drawWaveform = () => {
    if (!analyserRef.current || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const analyser = analyserRef.current
    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw)

      analyser.getByteTimeDomainData(dataArray)

      ctx.fillStyle = "rgb(var(--background))"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      ctx.lineWidth = 2
      ctx.strokeStyle = "rgb(var(--primary))"
      ctx.beginPath()

      const sliceWidth = (canvas.width * 1.0) / bufferLength
      let x = 0

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0
        const y = (v * canvas.height) / 2

        if (i === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }

        x += sliceWidth
      }

      ctx.lineTo(canvas.width, canvas.height / 2)
      ctx.stroke()
    }

    draw()
  }

  const startRecording = async () => {
    try {
      setError("")
      setPermissionDenied(false)

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      // Setup AudioContext for waveform
      audioContextRef.current = new AudioContext()
      analyserRef.current = audioContextRef.current.createAnalyser()
      const source = audioContextRef.current.createMediaStreamSource(stream)
      source.connect(analyserRef.current)
      analyserRef.current.fftSize = 2048
      drawWaveform()

      // Setup MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : "audio/mp4",
        audioBitsPerSecond: 64000,
      })

      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType })

        // Validate size before accepting (10 MB limit)
        const MAX_AUDIO_SIZE = 10 * 1024 * 1024
        if (blob.size > MAX_AUDIO_SIZE) {
          setError("Recording is too large (max 10 MB). Please record a shorter clip.")
          stream.getTracks().forEach((track) => track.stop())
          if (timerRef.current) clearInterval(timerRef.current)
          if (animationRef.current) cancelAnimationFrame(animationRef.current)
          setState("idle")
          return
        }

        setAudioBlob(blob)
        setAudioUrl(URL.createObjectURL(blob))
        stream.getTracks().forEach((track) => track.stop())
        if (timerRef.current) clearInterval(timerRef.current)
        if (animationRef.current) cancelAnimationFrame(animationRef.current)

        // AI transcription via Groq Whisper
        setState("transcribing")
        try {
          const form = new FormData()
          form.append("audio", blob)
          const res = await fetch("/api/transcribe", { method: "POST", body: form })
          if (res.ok) {
            const data = await res.json()
            if (data.text) {
              setTranscription(data.text)
              setTranscriptWords(data.words ?? [])
            }
          }
        } catch {
          // Keep Web Speech transcript if Groq fails
        }

        setState("stopped")
      }

      mediaRecorder.start()
      setState("recording")

      // Start speech recognition
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start()
        } catch (e) {
          console.error("Recognition start error:", e)
        }
      }

      // Start timer
      setDuration(0)
      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1)
      }, 1000)

      toast.success("Recording started")

    } catch (err) {
      console.error("Error starting recording:", err)
      setError("Failed to access microphone. Please check permissions.")
      setPermissionDenied(true)
      toast.error("Failed to access microphone")
    }
  }

  const pauseRecording = () => {
    if (mediaRecorderRef.current && state === "recording") {
      mediaRecorderRef.current.pause()
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      setState("paused")
      toast.info("Recording paused")
    }
  }

  const resumeRecording = () => {
    if (mediaRecorderRef.current && state === "paused") {
      mediaRecorderRef.current.resume()
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start()
        } catch (e) {
          console.error("Recognition resume error:", e)
        }
      }
      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1)
      }, 1000)
      setState("recording")
      toast.info("Recording resumed")
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch (e) {
          // Ignore errors
        }
      }
      setState("stopped")
      toast.success("Recording stopped")
    }
  }

  const discardRecording = () => {
    setAudioBlob(null)
    setAudioUrl("")
    setTranscription("")
    setDuration(0)
    setState("idle")
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl)
    }
  }

  const handleConfirm = () => {
    if (audioBlob && transcription) {
      onRecordingComplete(audioBlob, transcription, transcriptWords)
      toast.success("Recording saved! Now add a title and click 'Create Memorization'")
    } else if (audioBlob && !transcription) {
      toast.error("Please provide content for memorization")
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  // Browser compatibility check
  if (!isMediaRecorderSupported) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="size-4" />
        <AlertDescription>
          Your browser doesn't support audio recording. Please use a modern browser like Chrome, Firefox, or Edge.
        </AlertDescription>
      </Alert>
    )
  }

  // Show AI transcribing state
  if (state === "transcribing") {
    return (
      <Card className="p-6">
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm font-medium">Transcribing with AI…</p>
          <p className="text-xs text-muted-foreground">Using AI to transcribe your recording</p>
        </div>
      </Card>
    )
  }

  // Show preview after recording
  if (state === "stopped" && audioBlob) {
    return (
      <Card className="p-6 space-y-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="font-medium text-sm text-muted-foreground">Preview your recording</p>
            <p className="text-sm text-muted-foreground">{formatDuration(duration)}</p>
          </div>

          {/* Audio playback */}
          <div className="space-y-2">
            <Label>Audio Recording</Label>
            <audio src={audioUrl} controls className="w-full" />
          </div>

          {/* Transcription */}
          <div className="space-y-2">
            <Label htmlFor="transcription">
              Transcription {!isWebSpeechSupported && "(Type your content)"}
            </Label>
            <FieldDescription>
              This will become your memorization content. Edit as needed.
            </FieldDescription>
            <Textarea
              id="transcription"
              value={transcription}
              onChange={(e) => setTranscription(e.target.value)}
              placeholder={
                isWebSpeechSupported
                  ? "Edit the auto-generated transcription..."
                  : "Type the content you want to memorize..."
              }
              rows={10}
              className="resize-none leading-relaxed"
            />
            {!isWebSpeechSupported && (
              <p className="text-sm text-muted-foreground">
                Auto-transcription is not available. Please type your content manually.
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleConfirm} disabled={!transcription.trim()} className="flex-1">
            <Check className="size-4 mr-2" />
            Save Recording
          </Button>
          <Button onClick={discardRecording} variant="outline">
            <Trash2 className="size-4 mr-2" />
            Discard
          </Button>
        </div>
      </Card>
    )
  }

  // Show recording interface
  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div className="space-y-6">
          {/* Waveform visualization */}
          <div className="relative">
            <canvas
              ref={canvasRef}
              width={600}
              height={100}
              className="w-full h-24 rounded-md border bg-muted/30"
            />
            {state === "idle" && (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-sm text-muted-foreground">
                  Click "Start Recording" to begin
                </p>
              </div>
            )}
          </div>

          {/* Duration */}
          {(state === "recording" || state === "paused") && (
            <div className="text-center">
              <p className="text-3xl font-mono font-bold">{formatDuration(duration)}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {state === "recording" && (
                  <span className="inline-flex items-center gap-2">
                    <span className="size-2 rounded-full bg-red-500 animate-pulse" />
                    Recording...
                  </span>
                )}
                {state === "paused" && "Paused"}
              </p>
              <p className="text-xs text-muted-foreground/60 mt-2">
                Up to 1 hour · For best results, record shorter passages
              </p>
            </div>
          )}

          {/* Controls */}
          <div className="flex justify-center gap-2">
            {state === "idle" && (
              <Button onClick={startRecording} size="lg" className="gap-2">
                <Mic className="size-5" />
                Start Recording
              </Button>
            )}

            {state === "recording" && (
              <>
                <Button onClick={pauseRecording} variant="outline" size="lg">
                  <Pause className="size-5" />
                </Button>
                <Button onClick={stopRecording} variant="destructive" size="lg" className="gap-2">
                  <Square className="size-5" />
                  Stop
                </Button>
              </>
            )}

            {state === "paused" && (
              <>
                <Button onClick={resumeRecording} size="lg" className="gap-2">
                  <Play className="size-5" />
                  Resume
                </Button>
                <Button onClick={stopRecording} variant="destructive" size="lg" className="gap-2">
                  <Square className="size-5" />
                  Stop
                </Button>
              </>
            )}
          </div>

          {/* Live transcription preview */}
          {(state === "recording" || state === "paused") && transcription && (
            <div className="p-4 rounded-md border bg-muted/50">
              <p className="text-sm font-medium mb-2">Live Transcription:</p>
              <p className="text-sm whitespace-pre-wrap">{transcription}</p>
            </div>
          )}
        </div>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!isWebSpeechSupported && state === "idle" && (
        <Alert>
          <AlertCircle className="size-4" />
          <AlertDescription>
            Auto-transcription is not available in your browser. You'll need to transcribe the recording manually after finishing.
          </AlertDescription>
        </Alert>
      )}

      <Card className="p-4 bg-muted/50">
        <div className="flex gap-3">
          <Mic className="size-5 text-muted-foreground shrink-0 mt-0.5" />
          <div className="text-sm space-y-1">
            <p className="font-medium">How it works:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Click "Start Recording" and grant microphone access</li>
              <li>Speak clearly - your speech is being transcribed in real-time</li>
              <li>Click "Stop" when finished</li>
              <li>Review and edit the transcription before confirming</li>
              <li>The audio will be saved for future playback</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  )
}
