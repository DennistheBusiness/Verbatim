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
import { FileText, Type, Layers, X, Wand2, AlertCircle } from "lucide-react"

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
  const [contentSource, setContentSource] = useState<InputMethod>("text") // Track actual content source
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
    console.log('📝 Voice recording received in create page:', {
      transcriptionLength: transcription.length,
      blobSize: blob.size,
      hasBlob: !!blob
    })
    setContent(transcription)
    setAudioBlob(blob)
    setOriginalFilename("voice-recording.webm")
    setContentSource("voice") // Mark as voice source for DB
    setInputMethod("text") // Switch back to text tab to show the content
    setTouched((prev) => ({ ...prev, content: true }))
  }

  // Helper functions for chunking (from context but inline for preview)
  const parseIntoLines = (text: string) => {
    return text.split(/\n/).map((line) => line.trim()).filter((line) => line.length > 0)
  }

  const parseIntoParagraphs = (text: string) => {
    return text.split(/\n\s*\n+/).map((para) => para.trim()).filter((para) => para.length > 0)
  }

  const COMMON_ABBREVIATIONS = [
    "W.M.", "S.W.", "J.W.", "W.B.", "R.W.", "M.W.", "V.W.",
    "Mr.", "Mrs.", "Ms.", "Dr.", "Prof.", "Sr.", "Jr.",
    "etc.", "e.g.", "i.e.", "vs.", "Inc.", "Ltd.", "Co."
  ]

  const parseIntoSentences = (text: string) => {
    let normalized = text.replace(/\r\n/g, "\n").replace(/\n+/g, " ").replace(/\s+/g, " ").trim()
    
    COMMON_ABBREVIATIONS.forEach((abbr, idx) => {
      const placeholder = `__ABBR${idx}__`
      normalized = normalized.split(abbr).join(placeholder)
    })
    
    const rawSentences = normalized.split(/(?<=[.!?])\s+/)
    
    const sentences = rawSentences.map((sent) => {
      let restored = sent
      COMMON_ABBREVIATIONS.forEach((abbr, idx) => {
        const placeholder = `__ABBR${idx}__`
        restored = restored.split(placeholder).join(abbr)
      })
      return restored.trim()
    }).filter((s) => s.length > 0)
    
    return sentences
  }

  const parseCustomChunks = (text: string) => {
    return text.split(/---/).map((chunk) => chunk.trim()).filter((chunk) => chunk.length > 0)
  }

  const generatePreviewChunks = (text: string, mode: ChunkMode) => {
    if (!text || !text.trim()) return []
    
    switch (mode) {
      case "line":
        return parseIntoLines(text)
      case "paragraph":
        return parseIntoParagraphs(text)
      case "sentence":
        return parseIntoSentences(text)
      case "custom":
        return parseCustomChunks(text)
      default:
        return parseIntoParagraphs(text)
    }
  }

  // Live stats
  const stats = useMemo(() => {
    const trimmed = content.trim()
    if (!trimmed) {
      return { words: 0, lines: 0, paragraphs: 0, sentences: 0, customChunks: 0, chunks: 0 }
    }
    
    const words = trimmed.split(/\s+/).filter((w) => w.length > 0).length
    const lines = parseIntoLines(trimmed).length
    const paragraphs = parseIntoParagraphs(trimmed).length
    const sentences = parseIntoSentences(trimmed).length
    const customChunks = parseCustomChunks(trimmed).length
    
    let chunks = paragraphs
    if (chunkMode === "line") chunks = lines
    else if (chunkMode === "sentence") chunks = sentences
    else if (chunkMode === "custom") chunks = customChunks
    
    return { words, lines, paragraphs, sentences, customChunks, chunks }
  }, [content, chunkMode])

  const previewChunks = useMemo(() => {
    return generatePreviewChunks(content, chunkMode)
  }, [content, chunkMode])

  // Validation
  const isTitleValid = title.trim().length > 0
  const isContentValid = content.trim().length > 0
  const isValid = isTitleValid && isContentValid

  const handleSave = async () => {
    if (!isValid) return
    
    console.log('💾 Attempting to save memorization set:', {
      title: title.trim(),
      contentLength: content.trim().length,
      chunkMode,
      tagsCount: tags.length,
      hasAudioBlob: !!audioBlob,
      audioBlobSize: audioBlob?.size,
      originalFilename,
      contentSource // Use contentSource, not inputMethod
    })
    
    try {
      const id = await addSet(
        title.trim(), 
        content.trim(), 
        chunkMode, 
        tags,
        audioBlob,
        originalFilename,
        contentSource // Pass contentSource (actual source) not inputMethod (UI tab)
      )
      console.log('✅ Memorization set created with ID:', id)
      router.push(`/memorization/${id}`)
    } catch (error) {
      console.error('❌ Failed to create memorization set:', error)
      // Toast error is already shown in addSet
    }
  }

  const handleTitleBlur = () => setTouched((prev) => ({ ...prev, title: true }))
  const handleContentBlur = () => setTouched((prev) => ({ ...prev, content: true }))

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <Header title="Create Memorization" showBack />
      
      <main className="flex flex-1 flex-col p-4 pb-8">
        <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8">
          {/* Form Fields */}
          <FieldGroup>
            <Field data-invalid={touched.title && !isTitleValid ? true : undefined}>
              <FieldLabel htmlFor="title">Title</FieldLabel>
              <Input
                id="title"
                placeholder="e.g., Hamlet Soliloquy, Periodic Table, Speech Opening..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleTitleBlur}
                autoComplete="off"
              />
              {touched.title && !isTitleValid && (
                <p className="text-sm text-destructive">Please enter a title</p>
              )}
            </Field>

            <Field>
              <FieldLabel htmlFor="tags">Tags (optional)</FieldLabel>
              <div className="flex gap-2">
                <Input
                  id="tags"
                  placeholder="Add tags..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  autoComplete="off"
                />
                <Button type="button" onClick={addTag} variant="secondary">
                  Add
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-0.5 hover:text-destructive"
                      >
                        <X className="size-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              <FieldDescription>
                Press Enter or click Add to create a tag
              </FieldDescription>
            </Field>
            
            <Field data-invalid={touched.content && !isContentValid ? true : undefined}>
              <FieldLabel>Content to Memorize</FieldLabel>
              <ContentInputTabs
                activeTab={inputMethod}
                onTabChange={(method) => {
                  setInputMethod(method)
                  // Reset audio when switching away from voice
                  if (method === "text" && audioBlob) {
                    setAudioBlob(null)
                  }
                }}
                textContent={
                  <>
                    <Textarea
                      id="content"
                      placeholder="Paste or type the text you want to memorize..."
                      className="min-h-[240px] resize-none leading-relaxed"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      onBlur={handleContentBlur}
                    />
                    <FieldDescription>
                      Separate paragraphs with blank lines or use --- to create custom chunks
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
            
            <Field>
              <FieldLabel>Chunking Method</FieldLabel>
              <RadioGroup value={chunkMode} onValueChange={(value) => setChunkMode(value as ChunkMode)}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex items-center gap-3 rounded-lg border p-3 transition-colors has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5">
                    <RadioGroupItem value="line" id="line" />
                    <Label htmlFor="line" className="flex-1 cursor-pointer font-normal">
                      <div className="flex items-center gap-2">
                        <Type className="size-4" />
                        <span className="font-medium">By Line</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">Split on line breaks</div>
                    </Label>
                  </div>

                  <div className="flex items-center gap-3 rounded-lg border p-3 transition-colors has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5">
                    <RadioGroupItem value="paragraph" id="paragraph" />
                    <Label htmlFor="paragraph" className="flex-1 cursor-pointer font-normal">
                      <div className="flex items-center gap-2">
                        <FileText className="size-4" />
                        <span className="font-medium">By Paragraph</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">Split on blank lines</div>
                    </Label>
                  </div>

                  <div className="flex items-center gap-3 rounded-lg border p-3 transition-colors has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5">
                    <RadioGroupItem value="sentence" id="sentence" />
                    <Label htmlFor="sentence" className="flex-1 cursor-pointer font-normal">
                      <div className="flex items-center gap-2">
                        <Layers className="size-4" />
                        <span className="font-medium">By Sentence</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">Split on punctuation</div>
                    </Label>
                  </div>

                  <div className="flex items-center gap-3 rounded-lg border p-3 transition-colors has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5">
                    <RadioGroupItem value="custom" id="custom" />
                    <Label htmlFor="custom" className="flex-1 cursor-pointer font-normal">
                      <div className="flex items-center gap-2">
                        <Wand2 className="size-4" />
                        <span className="font-medium">Custom</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">Use --- separator</div>
                    </Label>
                  </div>
                </div>
              </RadioGroup>

              {chunkMode === "sentence" && (
                <Alert className="mt-3">
                  <AlertCircle className="size-4" />
                  <AlertDescription className="text-sm">
                    Sentence detection handles common abbreviations (Mr., Dr., W.M., etc.)
                  </AlertDescription>
                </Alert>
              )}

              {chunkMode === "custom" && (
                <Alert className="mt-3">
                  <AlertCircle className="size-4" />
                  <AlertDescription className="text-sm">
                    Use three dashes (---) to manually separate chunks in your text
                  </AlertDescription>
                </Alert>
              )}

              <FieldDescription>
                Choose how to divide the content into practice chunks
              </FieldDescription>
            </Field>

            {/* Chunk Preview */}
            {content.trim() && (
              <ChunkPreview chunks={previewChunks} mode={chunkMode} />
            )}
          </FieldGroup>

          {/* Live Stats */}
          <div className="flex items-center gap-6 rounded-xl bg-muted/50 px-4 py-3">
            <div className="flex items-center gap-2">
              <Type className="size-4 text-muted-foreground" />
              <span className="text-sm">
                <span className="font-medium tabular-nums">{stats.words}</span>
                <span className="text-muted-foreground"> word{stats.words !== 1 ? "s" : ""}</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Layers className="size-4 text-muted-foreground" />
              <span className="text-sm">
                <span className="font-medium tabular-nums">{stats.chunks}</span>
                <span className="text-muted-foreground"> 
                  {chunkMode === "line" && `line${stats.chunks !== 1 ? "s" : ""}`}
                  {chunkMode === "paragraph" && `paragraph${stats.chunks !== 1 ? "s" : ""}`}
                  {chunkMode === "sentence" && `sentence${stats.chunks !== 1 ? "s" : ""}`}
                  {chunkMode === "custom" && `chunk${stats.chunks !== 1 ? "s" : ""}`}
                </span>
              </span>
            </div>
          </div>

          {/* Spacer */}
          <div className="flex-1 min-h-4" />

          {/* Save Button */}
          <Button 
            onClick={handleSave} 
            disabled={!isValid}
            className="w-full"
            size="lg"
          >
            Create Memorization
          </Button>
        </div>
      </main>
    </div>
  )
}
