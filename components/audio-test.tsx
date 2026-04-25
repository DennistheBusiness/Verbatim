"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { compareTexts, type ComparisonResult, type WordComparisonStatus } from "@/lib/text-utils"
import { Mic, Square, CheckCircle2, XCircle, AlertTriangle, Trophy, TrendingUp, BookOpen, FileText, Headphones, RefreshCcw, Eye, EyeOff, Loader2 } from "lucide-react"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty"
import { useMemorization } from "@/lib/memorization-context"
import { toast } from "sonner"

interface AudioTestProps {
  setId: string
  content: string
  chunks: Array<{ id: string; text: string; orderIndex: number }>
  chunkMode: "paragraph" | "sentence" | "line" | "custom"
  onBack: () => void
}

function getWordClassName(status: WordComparisonStatus): string {
  switch (status) {
    case "correct":
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
    case "incorrect":
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
    case "missing":
      return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
    case "extra":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
  }
}

function getFeedback(accuracy: number): { label: string; description: string; icon: React.ReactNode; colorClass: string } {
  if (accuracy >= 90) {
    return {
      label: "Excellent recall",
      description: "Outstanding work! You have mastered this content.",
      icon: <Trophy className="size-5" />,
      colorClass: "text-emerald-600 dark:text-emerald-400",
    }
  }
  if (accuracy >= 75) {
    return {
      label: "Strong progress",
      description: "Good job! A few more practice sessions will help solidify your memory.",
      icon: <TrendingUp className="size-5" />,
      colorClass: "text-amber-600 dark:text-amber-400",
    }
  }
  return {
    label: "Needs more review",
    description: "Keep practicing! Focus on the sections you missed.",
    icon: <BookOpen className="size-5" />,
    colorClass: "text-red-600 dark:text-red-400",
  }
}

export function AudioTest({ setId, content, chunks, chunkMode, onBack }: AudioTestProps) {
  const { updateTestScore } = useMemorization()
  
  // Selection state
  const [testMode, setTestMode] = useState<"full" | "chunks" | null>(null)
  const [selectedChunks, setSelectedChunks] = useState<string[]>([])
  
  // Recording state
  const [isRecording, setIsRecording] = useState(false)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const [transcript, setTranscript] = useState("")
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  
  // Test state
  const [result, setResult] = useState<ComparisonResult | null>(null)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [showOriginal, setShowOriginal] = useState(false)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  // Get target content based on selection
  const getTargetContent = () => {
    if (testMode === "full") {
      return content
    }
    return chunks
      .filter(chunk => selectedChunks.includes(chunk.id))
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map(chunk => chunk.text)
      .join("\n\n")
  }

  // Handle chunk selection toggle
  const toggleChunk = (chunkId: string) => {
    setSelectedChunks(prev => 
      prev.includes(chunkId) 
        ? prev.filter(id => id !== chunkId)
        : [...prev, chunkId]
    )
  }

  // Select all chunks
  const selectAllChunks = () => {
    setSelectedChunks(chunks.map(c => c.id))
  }

  // Clear selection
  const clearSelection = () => {
    setSelectedChunks([])
  }

  // Start recording with AI transcription
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      const mediaRecorder = new MediaRecorder(stream, { audioBitsPerSecond: 64000 })
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm;codecs=opus' })
        setRecordedBlob(blob)
        stream.getTracks().forEach(track => track.stop())

        setIsTranscribing(true)
        try {
          const formData = new FormData()
          formData.append("audio", blob, "recording.webm")
          const res = await fetch("/api/transcribe", { method: "POST", body: formData })
          const data = await res.json()
          if (data.text) {
            setTranscript(data.text)
          } else {
            setIsEditing(true)
            toast.warning("AI transcription unavailable — type your answer below")
          }
        } catch {
          setIsEditing(true)
          toast.error("Transcription failed — type your answer below")
        } finally {
          setIsTranscribing(false)
        }
      }

      mediaRecorder.start()
      setIsRecording(true)
      setTranscript("")
      setIsTranscribing(false)
      toast.success('Recording started')
    } catch {
      toast.error('Could not access microphone')
    }
  }

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      toast.success('Recording stopped')
    }
  }

  // Retry recording
  const retryRecording = () => {
    setRecordedBlob(null)
    setTranscript("")
    setResult(null)
    setIsSubmitted(false)
    setIsEditing(false)
  }

  // Submit transcript for grading
  const handleSubmit = () => {
    const targetContent = getTargetContent()
    const comparison = compareTexts(transcript.trim(), targetContent)
    setResult(comparison)
    setIsSubmitted(true)
    setIsEditing(false)
    
    // Save test score
    const singleChunkId =
      testMode === "chunks" && selectedChunks.length === 1
        ? selectedChunks[0]
        : null
    updateTestScore(setId, "audioTest", comparison.accuracy, {
      totalWords: comparison.totalExpected,
      correctWords: comparison.correctCount,
      chunkId: singleChunkId,
    })
    toast.success("Progress saved")
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isRecording) {
        stopRecording()
      }
    }
  }, [])

  const wordCount = content.split(/\s+/).filter((w) => w.length > 0).length
  const targetContent = getTargetContent()
  const targetWordCount = targetContent.split(/\s+/).filter((w) => w.length > 0).length

  // Mode selection screen
  if (!testMode) {
    return (
      <div className="flex flex-col gap-4">
        <div className="rounded-lg bg-muted/50 p-3">
          <p className="text-sm text-muted-foreground">
            Choose what you want to test: the entire memorization or specific chunks.
          </p>
        </div>

        <Card className="cursor-pointer transition-colors hover:bg-accent/50" onClick={() => setTestMode("full")}>
          <CardContent className="flex items-center gap-4 py-5">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <FileText className="size-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Test Entire Memorization</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Record the complete passage from memory
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                {wordCount} words · {chunks.length} {chunkMode === "paragraph" ? "paragraph" : "sentence"}{chunks.length !== 1 ? "s" : ""}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer transition-colors hover:bg-accent/50" onClick={() => setTestMode("chunks")}>
          <CardContent className="flex items-center gap-4 py-5">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <Headphones className="size-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Test Specific Chunks</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Select which chunks you want to test
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Choose from {chunks.length} available chunks
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Full test ready-to-record screen
  if (testMode === "full" && !isRecording && !isTranscribing && !recordedBlob) {
    return (
      <div className="flex flex-col gap-4">
        <div className="rounded-lg bg-muted/50 p-3">
          <p className="text-sm text-muted-foreground">
            When you're ready, press record and recite the full passage from memory.
          </p>
        </div>
        <Card className="border-primary/20">
          <CardContent className="flex items-center gap-4 py-5">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <FileText className="size-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Full Passage</h3>
              <p className="mt-1 text-xs text-muted-foreground">{wordCount} words · {chunks.length} {chunkMode === "paragraph" ? "paragraph" : "sentence"}{chunks.length !== 1 ? "s" : ""}</p>
            </div>
          </CardContent>
        </Card>
        <Button onClick={startRecording} size="lg" className="w-full gap-2">
          <Mic className="size-4" />
          Start Recording
        </Button>
      </div>
    )
  }

  // Chunk selection screen
  if (testMode === "chunks" && !recordedBlob && !isRecording) {
    return (
      <div className="flex flex-col gap-4">
        <div className="rounded-lg bg-muted/50 p-3 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Select the chunks you want to test ({selectedChunks.length} selected)
          </p>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={selectAllChunks}>
              Select All
            </Button>
            {selectedChunks.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearSelection}>
                Clear
              </Button>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {chunks.map((chunk) => (
            <Card 
              key={chunk.id}
              className={`cursor-pointer transition-colors ${
                selectedChunks.includes(chunk.id) ? 'border-primary bg-primary/5' : 'hover:bg-accent/50'
              }`}
              onClick={() => toggleChunk(chunk.id)}
            >
              <CardContent className="flex items-start gap-3 py-3">
                <Checkbox
                  checked={selectedChunks.includes(chunk.id)}
                  onCheckedChange={() => toggleChunk(chunk.id)}
                  className="mt-1"
                />
                <div className="flex shrink-0 size-7 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                  {chunk.orderIndex + 1}
                </div>
                <p className="flex-1 text-sm leading-relaxed line-clamp-2">{chunk.text}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Button 
          onClick={() => startRecording()} 
          disabled={selectedChunks.length === 0}
          className="w-full"
        >
          Start Recording
        </Button>
      </div>
    )
  }

  // Recording screen
  if (isRecording || isTranscribing || (recordedBlob && !isSubmitted)) {
    return (
      <div className="flex flex-col gap-4">
        {/* Recording status */}
        <Card className={isRecording ? "border-red-500/50 bg-red-500/5" : "border-primary/20"}>
          <CardContent className="flex flex-col gap-4 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isRecording ? (
                  <>
                    <div className="flex size-12 items-center justify-center rounded-full bg-red-500/10 animate-pulse">
                      <Mic className="size-6 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Recording...</h3>
                      <p className="text-sm text-muted-foreground">
                        Speak clearly and at a natural pace
                      </p>
                    </div>
                  </>
                ) : isTranscribing ? (
                  <>
                    <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
                      <Loader2 className="size-6 text-primary animate-spin" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Transcribing with AI…</h3>
                      <p className="text-sm text-muted-foreground">
                        Processing your recording
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex size-12 items-center justify-center rounded-full bg-emerald-500/10">
                      <CheckCircle2 className="size-6 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Recording Complete</h3>
                      <p className="text-sm text-muted-foreground">
                        Review and edit your transcript before submitting
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {isRecording && (
              <Button onClick={stopRecording} variant="destructive" className="w-full">
                <Square className="size-4 mr-2" />
                Stop Recording
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Live / Final Transcript */}
        <Card>
          <CardContent className="flex flex-col gap-3 py-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">
                {isRecording ? "Recording…" : "Your Transcript"}
              </h3>
              {!isRecording && !isTranscribing && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(!isEditing)}
                >
                  {isEditing ? "Cancel Edit" : "Edit"}
                </Button>
              )}
            </div>

            {isTranscribing ? (
              <div className="flex min-h-[200px] items-center justify-center rounded-md border bg-muted/30 p-4">
                <div className="flex flex-col items-center gap-3 text-muted-foreground">
                  <Loader2 className="size-6 animate-spin" />
                  <p className="text-sm">Transcribing with AI…</p>
                </div>
              </div>
            ) : isEditing ? (
              <Textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="Edit your transcript..."
                className="min-h-[200px] font-mono text-sm"
              />
            ) : (
              <div className="min-h-[200px] rounded-md border bg-muted/30 p-4">
                <p className="whitespace-pre-wrap text-sm leading-relaxed">
                  {transcript || (isRecording ? "Listening…" : "No transcript available")}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        {!isRecording && !isTranscribing && (
          <div className="flex flex-col gap-2">
            <Button
              onClick={handleSubmit}
              disabled={!transcript.trim()}
              className="w-full"
            >
              Submit for Grading
            </Button>
            <Button
              onClick={retryRecording}
              variant="outline"
              className="w-full"
            >
              <RefreshCcw className="size-4 mr-2" />
              Record Again
            </Button>
          </div>
        )}
      </div>
    )
  }

  // Results screen
  if (isSubmitted && result) {
    const feedback = getFeedback(result.accuracy)
    
    return (
      <div className="flex flex-col gap-4">
        {/* Score Summary */}
        <Card className={`border-2 ${
          result.accuracy >= 90 ? 'border-emerald-500/50 bg-emerald-500/5' :
          result.accuracy >= 75 ? 'border-amber-500/50 bg-amber-500/5' :
          'border-red-500/50 bg-red-500/5'
        }`}>
          <CardContent className="flex flex-col items-center gap-4 py-6">
            <div className={`flex size-16 items-center justify-center rounded-full ${
              result.accuracy >= 90 ? 'bg-emerald-500/10' :
              result.accuracy >= 75 ? 'bg-amber-500/10' :
              'bg-red-500/10'
            }`}>
              <div className={feedback.colorClass}>
                {feedback.icon}
              </div>
            </div>
            <div className="flex flex-col items-center gap-1 text-center">
              <h2 className="text-2xl font-bold">{result.accuracy}%</h2>
              <p className={`text-sm font-medium ${feedback.colorClass}`}>
                {feedback.label}
              </p>
              <p className="text-sm text-muted-foreground">
                {feedback.description}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Statistics */}
        <Card>
          <CardContent className="py-4">
            <div className="grid grid-cols-4 gap-4">
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">{result.correctCount}</span>
                </div>
                <span className="text-xs text-muted-foreground">Correct</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-1">
                  <XCircle className="size-4 text-red-600 dark:text-red-400" />
                  <span className="text-lg font-semibold text-red-600 dark:text-red-400">{result.incorrectCount}</span>
                </div>
                <span className="text-xs text-muted-foreground">Incorrect</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-1">
                  <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400" />
                  <span className="text-lg font-semibold text-amber-600 dark:text-amber-400">{result.missingCount}</span>
                </div>
                <span className="text-xs text-muted-foreground">Missing</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-1">
                  <AlertTriangle className="size-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-lg font-semibold text-blue-600 dark:text-blue-400">{result.extraCount}</span>
                </div>
                <span className="text-xs text-muted-foreground">Extra</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Word-by-word comparison */}
        <Card>
          <CardContent className="flex flex-col gap-3 py-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Word-by-Word Analysis</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowOriginal(!showOriginal)}
              >
                {showOriginal ? <EyeOff className="size-4 mr-2" /> : <Eye className="size-4 mr-2" />}
                {showOriginal ? "Hide" : "Show"} Original
              </Button>
            </div>
            
            {showOriginal && (
              <div className="rounded-md border bg-muted/30 p-4">
                <p className="text-xs font-medium text-muted-foreground mb-2">Original Text:</p>
                <p className="whitespace-pre-wrap text-sm leading-7">
                  {targetContent}
                </p>
              </div>
            )}

            <div className="rounded-md border bg-muted/30 p-4">
              <p className="text-xs font-medium text-muted-foreground mb-2">Your Response:</p>
              <div className="flex flex-wrap gap-1">
                {result.words.map((word, index) => (
                  <span
                    key={index}
                    className={`inline-flex items-center rounded px-1.5 py-0.5 text-sm ${getWordClassName(word.status)}`}
                  >
                    {word.displayWord}
                  </span>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <Button onClick={retryRecording} variant="outline" className="w-full">
            <RefreshCcw className="size-4 mr-2" />
            Try Again
          </Button>
          <Button onClick={onBack} className="w-full">
            Back to Detail
          </Button>
        </div>
      </div>
    )
  }

  // Empty state
  return (
    <Empty className="flex-1 border-0">
      <EmptyHeader>
        <EmptyMedia variant="icon" className="size-12 rounded-full bg-muted text-muted-foreground [&_svg]:size-5">
          <FileText />
        </EmptyMedia>
        <EmptyTitle>No content to test</EmptyTitle>
        <EmptyDescription>
          This memorization set doesn&apos;t have any content to test. Try a different set.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button onClick={onBack} className="w-full">
          Return to Detail
        </Button>
      </EmptyContent>
    </Empty>
  )
}
