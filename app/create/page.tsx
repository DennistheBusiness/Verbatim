"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Field, FieldGroup, FieldLabel, FieldDescription } from "@/components/ui/field"
import { Header } from "@/components/header"
import { ContentInputTabs, type InputMethod as InputTab } from "@/components/content-input-tabs"
import { VoiceRecorder } from "@/components/voice-recorder"
import { ImageTextExtractor } from "@/components/image-text-extractor"
import { ChunkPreview } from "@/components/chunk-preview"
import { useMemorization, type ChunkMode, type TranscriptWord, type InputMethod } from "@/lib/memorization-context"
import { FileText, Type, Layers, Wand2, X, Plus } from "lucide-react"

type Step = "form" | "chunking"

const CHUNK_MODES: {
  value: ChunkMode
  icon: typeof FileText
  label: string
  desc: string
}[] = [
  { value: "paragraph", icon: FileText, label: "Paragraph", desc: "Split at blank lines — great for speeches & prose" },
  { value: "sentence",  icon: Layers,   label: "Sentence",  desc: "Split at punctuation — ideal for dense text" },
  { value: "line",      icon: Type,     label: "Line",      desc: "Split at line breaks — perfect for poetry & scripts" },
  { value: "custom",    icon: Wand2,    label: "Custom",    desc: "Use / in your text to set your own boundaries" },
]

export default function CreatePage() {
  const router = useRouter()
  const { addSet, getAllTags } = useMemorization()

  const [step, setStep] = useState<Step>("form")
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [chunkMode, setChunkMode] = useState<ChunkMode>("paragraph")
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")
  const [touched, setTouched] = useState({ title: false, content: false })
  const [inputMethod, setInputMethod] = useState<InputTab>("text")
  const [contentSource, setContentSource] = useState<InputMethod>("text")
  const [originalFilename, setOriginalFilename] = useState<string | null>(null)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [transcriptWords, setTranscriptWords] = useState<TranscriptWord[]>([])
  const [isSaving, setIsSaving] = useState(false)

  // ── Helpers ────────────────────────────────────────────────────────────────

  const parseIntoLines = (text: string) =>
    text.replace(/\r\n/g, "\n").split(/\n/).map(l => l.trim()).filter(Boolean)

  const parseIntoParagraphs = (text: string) =>
    text.replace(/\r\n/g, "\n").split(/\n\s*\n+/).map(p => p.trim()).filter(Boolean)

  const ABBR = ["W.M.","S.W.","J.W.","W.B.","R.W.","M.W.","V.W.","Mr.","Mrs.","Ms.","Dr.","Prof.","Sr.","Jr.","etc.","e.g.","i.e.","vs.","Inc.","Ltd.","Co."]

  const parseIntoSentences = (text: string) => {
    let s = text.replace(/\r\n/g, "\n").replace(/\n+/g, " ").replace(/\s+/g, " ").trim()
    if (!s) return []
    ABBR.forEach((a, i) => { s = s.split(a).join(`__A${i}__`) })
    return s.split(/(?<=[.!?])\s+/).map(sent => {
      let r = sent
      ABBR.forEach((a, i) => { r = r.split(`__A${i}__`).join(a) })
      return r.trim()
    }).filter(Boolean)
  }

  const parseCustomChunks = (text: string) =>
    text.replace(/\r\n/g, "\n").split(/\/+/).map(c => c.trim()).filter(Boolean)

  const getChunks = (text: string, mode: ChunkMode) => {
    if (!text.trim()) return []
    switch (mode) {
      case "line":      return parseIntoLines(text)
      case "paragraph": return parseIntoParagraphs(text)
      case "sentence":  return parseIntoSentences(text)
      case "custom":    return parseCustomChunks(text)
    }
  }

  const previewChunks = useMemo(() => getChunks(content, chunkMode), [content, chunkMode])

  const wordCount = useMemo(() => {
    const t = content.trim()
    return t ? t.split(/\s+/).filter(Boolean).length : 0
  }, [content])

  const existingTags = useMemo(() => getAllTags(), [getAllTags])

  const suggestedTags = useMemo(() => {
    const q = tagInput.trim().toLowerCase()
    return existingTags
      .filter((tag) => !tags.some((selected) => selected.toLowerCase() === tag.toLowerCase()))
      .filter((tag) => (q ? tag.toLowerCase().includes(q) : true))
      .slice(0, 12)
  }, [existingTags, tagInput, tags])

  const countLabel = (mode: ChunkMode) => {
    const n = getChunks(content, mode).length
    const unit = mode === "paragraph" ? "paragraph" : mode === "sentence" ? "sentence" : mode === "line" ? "line" : "chunk"
    return `${n} ${unit}${n !== 1 ? "s" : ""}`
  }

  // ── Validation ────────────────────────────────────────────────────────────

  const isTitleValid   = title.trim().length > 0
  const isContentValid = content.trim().length > 0
  const isValid        = isTitleValid && isContentValid

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleVoiceRecording = (blob: Blob, transcription: string, words: TranscriptWord[]) => {
    setContent(transcription)
    setAudioBlob(blob)
    setTranscriptWords(words)
    setOriginalFilename("voice-recording.webm")
    setContentSource("voice")
    setInputMethod("text")
    setTouched(p => ({ ...p, content: true }))
  }

  const handleImageExtraction = (text: string) => {
    setContent(text)
    setContentSource("text")
    setInputMethod("text")
    setTouched(p => ({ ...p, content: true }))
  }

  const addTag = () => {
    const t = tagInput.trim()
    if (t && !tags.some((existing) => existing.toLowerCase() === t.toLowerCase())) {
      setTags([...tags, t])
      setTagInput("")
    }
  }

  const selectSuggestedTag = (tag: string) => {
    if (!tags.some((existing) => existing.toLowerCase() === tag.toLowerCase())) {
      setTags((prev) => [...prev, tag])
    }
    setTagInput("")
  }

  const handleTagKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") { e.preventDefault(); addTag() }
  }

  const handleContinue = () => {
    setTouched({ title: true, content: true })
    if (isValid) setStep("chunking")
  }

  const doSave = async (mode: ChunkMode) => {
    if (!isValid || isSaving) return
    setIsSaving(true)
    try {
      const id = await addSet(
        title.trim(), content.trim(), mode, tags,
        audioBlob, originalFilename, contentSource,
        contentSource === "voice" ? content.trim() : null,
        transcriptWords.length > 0 ? transcriptWords : null,
      )
      router.push(`/memorization/${id}`)
    } catch {
      setIsSaving(false)
    }
  }

  // ── Chunking step ─────────────────────────────────────────────────────────

  if (step === "chunking") {
    return (
      <div className="flex min-h-svh flex-col bg-background">
        <Header title="Split Your Content" showBack onBack={() => setStep("form")} />

        <main className="flex flex-1 flex-col px-4 pt-5 pb-36">
          <div className="mx-auto w-full max-w-lg flex flex-col gap-6">

            {/* Header copy */}
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-semibold tracking-tight">Choose a chunk style</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Chunks are the pieces you'll memorize one at a time. Pick the split that feels natural for your content.
              </p>
            </div>

            {/* Mode cards */}
            <div className="flex flex-col gap-2.5">
              {CHUNK_MODES.map(({ value, icon: Icon, label, desc }) => {
                const selected = chunkMode === value
                const count = content.trim() ? getChunks(content, value).length : null
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setChunkMode(value)}
                    className={cn(
                      "w-full flex items-center gap-4 rounded-2xl border-2 px-4 py-4 text-left transition-all duration-150 active:scale-[0.985]",
                      selected
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border bg-card hover:border-muted-foreground/30 hover:bg-accent/40"
                    )}
                  >
                    {/* Icon */}
                    <div className={cn(
                      "flex size-10 shrink-0 items-center justify-center rounded-xl transition-colors",
                      selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    )}>
                      <Icon className="size-5" />
                    </div>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={cn("font-semibold text-sm", selected ? "text-primary" : "text-foreground")}>
                          {label}
                        </span>
                        {count !== null && (
                          <span className={cn(
                            "text-xs font-medium tabular-nums px-1.5 py-0.5 rounded-full",
                            selected ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                          )}>
                            {countLabel(value)}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{desc}</p>
                    </div>

                    {/* Selection ring */}
                    <div className={cn(
                      "size-5 shrink-0 rounded-full border-2 flex items-center justify-center transition-colors",
                      selected ? "border-primary bg-primary" : "border-border"
                    )}>
                      {selected && <div className="size-2 rounded-full bg-primary-foreground" />}
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Live preview */}
            {previewChunks.length > 0 && (
              <div className="flex flex-col gap-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Preview</p>
                <ChunkPreview chunks={previewChunks} mode={chunkMode} defaultOpen />
              </div>
            )}

            {/* Changeable later note */}
            <p className="text-xs text-center text-muted-foreground/60">
              This setting can be changed later from the set detail page.
            </p>

          </div>
        </main>

        {/* Sticky CTA */}
        <div className="fixed inset-x-0 bottom-0 z-10 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 px-4 py-4 pb-safe">
          <div className="mx-auto max-w-lg flex flex-col gap-2">
            <Button
              size="lg"
              className="w-full"
              onClick={() => doSave(chunkMode)}
              disabled={isSaving}
            >
              {isSaving ? "Saving…" : "Save"}
            </Button>
            <Button
              variant="ghost"
              className="w-full text-muted-foreground text-sm"
              onClick={() => doSave("paragraph")}
              disabled={isSaving}
            >
              Skip — use Paragraph
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // ── Form step ─────────────────────────────────────────────────────────────

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
                onBlur={() => setTouched(p => ({ ...p, title: true }))}
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
                      onBlur={() => setTouched(p => ({ ...p, content: true }))}
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

            {/* Tags */}
            <Field>
              <FieldLabel>Tags <span className="text-muted-foreground font-normal">(optional)</span></FieldLabel>
              <div className="relative">
                <Input
                  id="tags"
                  placeholder="Type a tag and press Enter…"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKey}
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
              {suggestedTags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {suggestedTags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => selectSuggestedTag(tag)}
                      className="rounded-full border border-border bg-background px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              )}
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1 pr-1">
                      {tag}
                      <button type="button" onClick={() => setTags(tags.filter(t => t !== tag))} className="hover:text-destructive">
                        <X className="size-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </Field>
          </FieldGroup>

          {/* Word count pill */}
          {content.trim() && (
            <div className="flex items-center gap-1.5 self-start rounded-full bg-muted px-3 py-1.5 text-xs text-muted-foreground">
              <Type className="size-3.5" />
              <span className="font-medium tabular-nums">{wordCount}</span>
              <span>words</span>
            </div>
          )}

        </div>
      </main>

      {/* Sticky CTA */}
      <div className="fixed inset-x-0 bottom-0 z-10 border-t bg-background/95 p-4 pb-safe backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto max-w-2xl">
          <Button onClick={handleContinue} disabled={!isValid} className="w-full" size="lg">
            Create Memorization
          </Button>
        </div>
      </div>
    </div>
  )
}
