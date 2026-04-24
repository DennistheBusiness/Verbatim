"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Field, FieldGroup, FieldLabel, FieldDescription } from "@/components/ui/field"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Header } from "@/components/header"
import { ContentInputTabs, type InputMethod } from "@/components/content-input-tabs"
import { VoiceRecorder } from "@/components/voice-recorder"
import { ChunkPreview } from "@/components/chunk-preview"
import { useMemorization, type ChunkMode } from "@/lib/memorization-context"
import { FileText, Type, Layers, X, Wand2, AlertCircle, Plus } from "lucide-react"

export default function CreatePage() {
  const router = useRouter()
  const { addSet } = useMemorization()
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [chunkMode, setChunkMode] = useState<ChunkMode>("paragraph")
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")
  const [touched, setTouched] = useState({ title: false, content: false })
  const [inputMethod, setInputMethod] = useState<InputMethod>("text")
  const [contentSource, setContentSource] = useState<InputMethod>("text")
  const [originalFilename, setOriginalFilename] = useState<string | null>(null)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)

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

  const handleVoiceRecording = (blob: Blob, transcription: string) => {
    setContent(transcription)
    setAudioBlob(blob)
    setOriginalFilename("voice-recording.webm")
    setContentSource("voice")
    setInputMethod("text")
    setTouched((prev) => ({ ...prev, content: true }))
  }

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

  const generatePreviewChunks = (text: string, mode: ChunkMode) => {
    if (!text || !text.trim()) return []
    switch (mode) {
      case "line":      return parseIntoLines(text)
      case "paragraph": return parseIntoParagraphs(text)
      case "sentence":  return parseIntoSentences(text)
      case "custom":    return parseCustomChunks(text)
      default:          return parseIntoParagraphs(text)
    }
  }

  const stats = useMemo(() => {
    const trimmed = content.trim()
    if (!trimmed) return { words: 0, chunks: 0 }
    const words = trimmed.split(/\s+/).filter((w) => w.length > 0).length
    const chunks = generatePreviewChunks(trimmed, chunkMode).length
    return { words, chunks }
  }, [content, chunkMode])

  const previewChunks = useMemo(() => generatePreviewChunks(content, chunkMode), [content, chunkMode])

  const isTitleValid = title.trim().length > 0
  const isContentValid = content.trim().length > 0
  const isValid = isTitleValid && isContentValid

  const handleSave = async () => {
    if (!isValid) return
    try {
      const id = await addSet(
        title.trim(),
        content.trim(),
        chunkMode,
        tags,
        audioBlob,
        originalFilename,
        contentSource,
      )
      router.push(`/memorization/${id}`)
    } catch {
      // Toast error is already shown in addSet
    }
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

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <Header title="New Memorization" showBack />

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
              <ContentInputTabs
                activeTab={inputMethod}
                onTabChange={(method) => {
                  setInputMethod(method)
                  if (method === "text" && audioBlob) setAudioBlob(null)
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
              />
              {touched.content && !isContentValid && (
                <p className="text-sm text-destructive">Please provide some content</p>
              )}
            </Field>

            {/* Chunk method */}
            <Field>
              <FieldLabel>Split content by</FieldLabel>
              <RadioGroup value={chunkMode} onValueChange={(v) => setChunkMode(v as ChunkMode)}>
                <div className="grid grid-cols-2 gap-2">
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
                      <RadioGroupItem value={value} id={value} />
                      <Label htmlFor={value} className="flex-1 cursor-pointer font-normal leading-none">
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

          {/* Live stats + chunk preview */}
          {content.trim() && (
            <div className="flex flex-col gap-3">
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
              <ChunkPreview chunks={previewChunks} mode={chunkMode} />
            </div>
          )}

        </div>
      </main>

      {/* Sticky save bar */}
      <div className="fixed inset-x-0 bottom-0 z-10 border-t bg-background/95 p-4 pb-safe backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto max-w-2xl">
          <Button onClick={handleSave} disabled={!isValid} className="w-full" size="lg">
            Create Memorization
          </Button>
        </div>
      </div>
    </div>
  )
}
