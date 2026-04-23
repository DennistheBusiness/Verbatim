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
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useMemorization, type ChunkMode } from "@/lib/memorization-context"
import { FileText, Type, Trash2, AlertCircle, Layers, X, AlertTriangle, Wand2 } from "lucide-react"
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
    setInputMethod("text") // Switch to text tab to show content
    setTouched((prev) => ({ ...prev, content: true }))
  }

  // Initialize form with existing data
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

  // Live stats
  const stats = useMemo(() => {
    const trimmed = content.trim()
    if (!trimmed) {
      return { words: 0, paragraphs: 0, sentences: 0, chunks: 0 }
    }
    
    const words = trimmed.split(/\s+/).filter((w) => w.length > 0).length
    const paragraphs = trimmed
      .split(/\n\s*\n|\n/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0).length
    
    const normalized = trimmed.replace(/\r\n/g, "\n").replace(/\n+/g, " ").replace(/\s+/g, " ")
    const sentences = normalized.split(/(?<=[.!?])\s+/).filter((s) => s.length > 0).length
    
    const chunks = chunkMode === "paragraph" ? paragraphs : sentences
    
    return { words, paragraphs, sentences, chunks }
  }, [content, chunkMode])

  // Validation
  const isTitleValid = title.trim().length > 0
  const isContentValid = content.trim().length > 0
  const isValid = isTitleValid && isContentValid

  const handleSave = async () => {
    if (!isValid) return
    
    // Update chunk mode FIRST if it changed, so chunks are generated with new mode
    if (set && chunkMode !== set.chunkMode) {
      await updateChunkMode(id, chunkMode)
    }
    
    await updateSet(
      id, 
      title.trim(), 
      content.trim(), 
      tags,
      audioBlob,
      originalFilename,
      contentSource
    )
    
    router.push(`/memorization/${id}`)
  }

  const handleDelete = () => {
    setIsDeleting(true)
    deleteSet(id)
    router.push("/")
  }

  const handleTitleBlur = () => setTouched((prev) => ({ ...prev, title: true }))
  const handleContentBlur = () => setTouched((prev) => ({ ...prev, content: true }))

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
              
              {/* Show warning if replacing existing audio */}
              {hasExistingAudio && audioBlob && (
                <Alert className="mb-3 border-amber-500/50 bg-amber-500/10">
                  <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400" />
                  <AlertDescription className="text-sm">
                    You're about to replace the existing audio recording with a new one. The old recording will be permanently deleted.
                  </AlertDescription>
                </Alert>
              )}

              <ContentInputTabs
                activeTab={inputMethod}
                onTabChange={(method) => {
                  setInputMethod(method)
                  // Clear audio if switching away from voice without saving
                  if (method === "text" && audioBlob && !hasExistingAudio) {
                    setAudioBlob(null)
                    setOriginalFilename(null)
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
                      Separate paragraphs with blank lines or use / to create custom chunks
                    </FieldDescription>
                  </>
                }
                voiceContent={
                  <VoiceRecorder onRecordingComplete={handleVoiceRecording} />
                }
              />
              {touched.content && !isContentValid && (
                <p className="text-sm text-destructive">Please enter some content</p>
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
              <FieldDescription>
                Choose how to divide the content into practice chunks
              </FieldDescription>
            </Field>
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
                <span className="text-muted-foreground"> {chunkMode === "paragraph" ? "paragraph" : "sentence"}{stats.chunks !== 1 ? "s" : ""}</span>
              </span>
            </div>
          </div>

          {/* Spacer */}
          <div className="flex-1 min-h-4" />

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            <Button 
              onClick={handleSave} 
              disabled={!isValid}
              className="w-full"
              size="lg"
            >
              Save Changes
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="outline" 
                  className="w-full gap-2 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  size="lg"
                  disabled={isDeleting}
                >
                  <Trash2 className="size-4" />
                  Delete Memorization
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
      </main>
    </div>
  )
}
