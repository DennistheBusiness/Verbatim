"use client"

import { use, useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Field, FieldGroup, FieldLabel, FieldDescription } from "@/components/ui/field"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Header } from "@/components/header"
import { ContentInputTabs, type InputMethod } from "@/components/content-input-tabs"
import { VoiceRecorder } from "@/components/voice-recorder"
import { ImageTextExtractor } from "@/components/image-text-extractor"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useMemorization, type ChunkMode, type TranscriptWord } from "@/lib/memorization-context"
import { trackEvent } from "@/lib/analytics"
import { MEMORIZATION_UPDATED, MEMORIZATION_DELETED } from "@/lib/analytics-events"
import { FileText, Type, Trash2, AlertCircle, Layers, X, AlertTriangle, Wand2, Plus } from "lucide-react"
import { ChunkPreview } from "@/components/chunk-preview"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty"
import { Spinner } from "@/components/ui/spinner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog"
import Link from "next/link"

interface EditPageProps {
  params: Promise<{ id: string }>
}

export default function EditPage({ params }: EditPageProps) {
  const { id } = use(params)
  const router = useRouter()
  const { getSet, updateSet, deleteSet, isLoaded, updateChunkMode } = useMemorization()
  const set = getSet(id)

  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [chunkMode, setChunkMode] = useState<ChunkMode>("paragraph")
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")
  const [touched, setTouched] = useState({ title: false, content: false })
  const [isDeleting, setIsDeleting] = useState(false)
  const [inputMethod, setInputMethod] = useState<InputMethod>("text")
  const [contentSource, setContentSource] = useState<InputMethod>("text")
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [originalFilename, setOriginalFilename] = useState<string | null>(null)
  const [hasExistingAudio, setHasExistingAudio] = useState(false)
  const [transcriptWords, setTranscriptWords] = useState<TranscriptWord[]>([])

  const addTag = () => {
    const trimmedTag = tagInput.trim()
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag])
      setTagInput("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove))
  }

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      addTag()
    }
  }

  const handleVoiceRecording = (blob: Blob, transcription: string, words: TranscriptWord[]) => {
    setContent(transcription)
    setAudioBlob(blob)
    setTranscriptWords(words)
    setOriginalFilename("voice-recording.webm")
    setContentSource("voice")
    setInputMethod("text")
    setTouched((prev) => ({ ...prev, content: true }))
  }

  const handleImageExtraction = (text: string) => {
    setContent(text)
    setContentSource("text")
    setInputMethod("text")
    setTouched((prev) => ({ ...prev, content: true }))
  }

  useEffect(() => {
    if (set) {
      setTitle(set.title)
      setContent(set.content)
      setChunkMode(set.chunkMode)
      setTags(set.tags || [])
      setContentSource(set.createdFrom)
      setHasExistingAudio(!!set.audioFilePath)
      setOriginalFilename(set.originalFilename)
    }
  }, [set])

  const parseIntoLines = (text: string) => {
    return text.replace(/\r\n/g, "\n").split(/\n/).map((line) => line.trim()).filter((line) => line.length > 0)
  }

  const parseIntoParagraphs = (text: string) => {
    return text
      .replace(/\r\n/g, "\n")
      .split(/\n\s*\n+/)
      .map((para) => para.trim())
      .filter((para) => para.length > 0)
  }

  const COMMON_ABBREVIATIONS = [
    "W.M.", "S.W.", "J.W.", "W.B.", "R.W.", "M.W.", "V.W.",
    "Mr.", "Mrs.", "Ms.", "Dr.", "Prof.", "Sr.", "Jr.",
    "etc.", "e.g.", "i.e.", "vs.", "Inc.", "Ltd.", "Co."
  ]

  const parseIntoSentences = (text: string) => {
    let normalized = text.replace(/\r\n/g, "\n").replace(/\n+/g, " ").replace(/\s+/g, " ").trim()
    if (!normalized) return []
    COMMON_ABBREVIATIONS.forEach((abbr, idx) => {
      normalized = normalized.split(abbr).join(`__ABBR${idx}__`)
    })
    const rawSentences = normalized.split(/(?<=[.!?])\s+/)
    return rawSentences.map((sent) => {
      let restored = sent
      COMMON_ABBREVIATIONS.forEach((abbr, idx) => {
        restored = restored.split(`__ABBR${idx}__`).join(abbr)
      })
      return restored.trim()
    }).filter((s) => s.length > 0)
  }

  const parseCustomChunks = (text: string) => {
    return text
      .replace(/\r\n/g, "\n")
      .split(/\/+/)
      .map((chunk) => chunk.trim())
      .filter((chunk) => chunk.length > 0)
  }

  const getChunkCount = (text: string, mode: ChunkMode) => {
    if (!text.trim()) return 0
    switch (mode) {
      case "line":      return parseIntoLines(text).length
      case "paragraph": return parseIntoParagraphs(text).length
      case "sentence":  return parseIntoSentences(text).length
      case "custom":    return parseCustomChunks(text).length
      default:          return parseIntoParagraphs(text).length
    }
  }

  const currentChunks = useMemo(() => {
    const trimmed = content.trim()
    if (!trimmed) return []
    switch (chunkMode) {
      case "line":      return parseIntoLines(trimmed)
      case "sentence":  return parseIntoSentences(trimmed)
      case "custom":    return parseCustomChunks(trimmed)
      default:          return parseIntoParagraphs(trimmed)
    }
  }, [content, chunkMode])

  const stats = useMemo(() => {
    const trimmed = content.trim()
    if (!trimmed) return { words: 0, chunks: 0 }
    const words = trimmed.split(/\s+/).filter((w) => w.length > 0).length
    const chunks = getChunkCount(trimmed, chunkMode)
    return { words, chunks }
  }, [content, chunkMode])

  const isTitleValid = title.trim().length > 0
  const isContentValid = content.trim().length > 0
  const isValid = isTitleValid && isContentValid

  const handleSave = async () => {
    if (!isValid) return
    if (set && chunkMode !== set.chunkMode) {
      await updateChunkMode(id, chunkMode)
    }
    await updateSet(
      id, title.trim(), content.trim(), tags, audioBlob, originalFilename, contentSource,
      transcriptWords.length > 0 ? content.trim() : undefined,
      transcriptWords.length > 0 ? transcriptWords : undefined,
    )
    trackEvent(MEMORIZATION_UPDATED, { set_id: id, chunk_mode: chunkMode })
    router.push(`/memorization/${id}`)
  }

  const handleDelete = () => {
    setIsDeleting(true)
    trackEvent(MEMORIZATION_DELETED, { set_id: id })
    deleteSet(id)
    router.push("/")
  }

  const handleTitleBlur = () => setTouched((prev) => ({ ...prev, title: true }))
  const handleContentBlur = () => setTouched((prev) => ({ ...prev, content: true }))

  const chunkLabel = () => {
    const n = stats.chunks
    switch (chunkMode) {
      case "line":      return `${n} line${n !== 1 ? "s" : ""}`
      case "paragraph": return `${n} paragraph${n !== 1 ? "s" : ""}`
      case "sentence":  return `${n} sentence${n !== 1 ? "s" : ""}`
      case "custom":    return `${n} chunk${n !== 1 ? "s" : ""}`
    }
  }

  if (!isLoaded) {
    return (
      <div className="flex min-h-svh flex-col bg-background">
        <Header title="Edit Memorization" showBack />
        <main className="flex flex-1 flex-col items-center justify-center gap-3">
          <Spinner className="size-8" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </main>
      </div>
    )
  }

  if (!set) {
    return (
      <div className="flex min-h-svh flex-col bg-background">
        <Header title="Edit Memorization" showBack />
        <main className="flex flex-1 flex-col items-center justify-center p-4">
          <Empty className="max-w-sm border-0">
            <EmptyHeader>
              <EmptyMedia variant="icon" className="size-14 rounded-full bg-muted text-muted-foreground [&_svg]:size-6">
                <AlertCircle />
              </EmptyMedia>
              <EmptyTitle>Memorization not found</EmptyTitle>
              <EmptyDescription>
                This memorization set may have been deleted or the link is incorrect.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button asChild size="lg" className="w-full">
                <Link href="/">Back to Library</Link>
              </Button>
            </EmptyContent>
          </Empty>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <Header title="Edit Memorization" showBack />

      <main className="flex flex-1 flex-col p-4 pb-28">
        <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6">

          <FieldGroup>
            {/* Title */}
            <Field data-invalid={touched.title && !isTitleValid ? true : undefined}>
              <FieldLabel htmlFor="title">Title</FieldLabel>
              <Input
                id="title"
                placeholder="e.g., Hamlet Soliloquy, Gettysburg Address…"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleTitleBlur}
                autoComplete="off"
              />
              {touched.title && !isTitleValid && (
                <p className="text-sm text-destructive">Please enter a title</p>
              )}
            </Field>

            {/* Content */}
            <Field data-invalid={touched.content && !isContentValid ? true : undefined}>
              <FieldLabel>Content to Memorize</FieldLabel>

              {hasExistingAudio && audioBlob && (
                <Alert className="mb-3 border-amber-500/50 bg-amber-500/10">
                  <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400" />
                  <AlertDescription className="text-sm">
                    You're about to replace the existing audio recording. The old recording will be permanently deleted.
                  </AlertDescription>
                </Alert>
              )}

              <ContentInputTabs
                activeTab={inputMethod}
                onTabChange={(method) => {
                  setInputMethod(method)
                  if (method === "text" && audioBlob && !hasExistingAudio) {
                    setAudioBlob(null)
                    setOriginalFilename(null)
                  }
                }}
                textContent={
                  <>
                    <Textarea
                      id="content"
                      placeholder="Paste or type the text you want to memorize…"
                      className="min-h-[200px] resize-none leading-relaxed"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      onBlur={handleContentBlur}
                    />
                    <FieldDescription>
                      Separate paragraphs with blank lines, or use / to create custom chunks
                    </FieldDescription>
                  </>
                }
                voiceContent={
                  <VoiceRecorder onRecordingComplete={handleVoiceRecording} />
                }
                imageContent={
                  <ImageTextExtractor onComplete={handleImageExtraction} />
                }
              />
              {touched.content && !isContentValid && (
                <p className="text-sm text-destructive">Please provide some content</p>
              )}
            </Field>

            {/* Chunk method */}
            <Field>
              <FieldLabel>Split content by</FieldLabel>
              <RadioGroup value={chunkMode} onValueChange={(v) => setChunkMode(v as ChunkMode)}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { value: "paragraph", Icon: FileText, label: "Paragraph", desc: "Blank lines" },
                    { value: "sentence",  Icon: Layers,   label: "Sentence",  desc: "Punctuation" },
                    { value: "line",      Icon: Type,     label: "Line",      desc: "Line breaks" },
                    { value: "custom",    Icon: Wand2,    label: "Custom",    desc: "/ separator" },
                  ].map(({ value, Icon, label, desc }) => (
                    <div
                      key={value}
                      className="flex items-center gap-2.5 rounded-xl border p-3 transition-colors has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5"
                    >
                      <RadioGroupItem value={value} id={`edit-${value}`} />
                      <Label htmlFor={`edit-${value}`} className="flex-1 cursor-pointer font-normal leading-none">
                        <div className="flex items-center gap-1.5">
                          <Icon className="size-3.5 text-muted-foreground" />
                          <span className="font-medium text-sm">{label}</span>
                        </div>
                        <div className="mt-0.5 text-xs text-muted-foreground">{desc}</div>
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>

              {chunkMode === "sentence" && (
                <Alert className="mt-2">
                  <AlertCircle className="size-4" />
                  <AlertDescription className="text-sm">
                    Handles common abbreviations (Mr., Dr., W.M., etc.)
                  </AlertDescription>
                </Alert>
              )}
              {chunkMode === "custom" && (
                <Alert className="mt-2">
                  <AlertCircle className="size-4" />
                  <AlertDescription className="text-sm">
                    Use / anywhere in your text to set chunk boundaries
                  </AlertDescription>
                </Alert>
              )}

              {currentChunks.length > 0 && (
                <div className="mt-3">
                  <ChunkPreview chunks={currentChunks} mode={chunkMode} />
                </div>
              )}
            </Field>

            {/* Tags */}
            <Field>
              <FieldLabel>Tags <span className="text-muted-foreground font-normal">(optional)</span></FieldLabel>
              <div className="relative">
                <Input
                  id="tags"
                  placeholder="Type a tag and press Enter…"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  autoComplete="off"
                  className="pr-10"
                />
                {tagInput.trim() && (
                  <button
                    type="button"
                    onClick={addTag}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-muted-foreground hover:text-foreground"
                  >
                    <Plus className="size-4" />
                  </button>
                )}
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1 pr-1">
                      {tag}
                      <button type="button" onClick={() => removeTag(tag)} className="hover:text-destructive">
                        <X className="size-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </Field>
          </FieldGroup>

          {/* Live stats */}
          {content.trim() && (
            <div className="flex items-center gap-4 rounded-xl bg-muted/50 px-4 py-3">
              <div className="flex items-center gap-1.5 text-sm">
                <Type className="size-4 text-muted-foreground" />
                <span className="font-semibold tabular-nums">{stats.words}</span>
                <span className="text-muted-foreground">words</span>
              </div>
              <span className="text-muted-foreground/30">·</span>
              <div className="flex items-center gap-1.5 text-sm">
                <Layers className="size-4 text-muted-foreground" />
                <span className="font-semibold tabular-nums text-primary">{chunkLabel()}</span>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Sticky save/delete bar */}
      <div className="fixed inset-x-0 bottom-0 z-10 border-t bg-background/95 p-4 pb-safe backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex max-w-2xl flex-col gap-2">
          <Button onClick={handleSave} disabled={!isValid} className="w-full" size="lg">
            Save Changes
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                className="w-full gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
                size="lg"
                disabled={isDeleting}
              >
                <Trash2 className="size-4" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Memorization?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete "{set.title}" and all associated progress. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  )
}
