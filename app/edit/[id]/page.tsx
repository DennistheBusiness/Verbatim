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
import { ChunkPreview } from "@/components/chunk-preview"
import { useMemorization, type ChunkMode, type Chunk } from "@/lib/memorization-context"
import { FileText, Type, Trash2, AlertCircle, Layers, X, Wand2 } from "lucide-react"
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

// Import generateChunks helper
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

function parseIntoLines(content: string): string[] {
  return content
    .replace(/\r\n/g, "\n")
    .split(/\n/)
    .map((p) => p.trim().replace(/\s+/g, " "))
    .filter((p) => p.length > 0)
}

function parseIntoParagraphs(content: string): string[] {
  return content
    .replace(/\r\n/g, "\n")
    .split(/\n\s*\n+/)
    .map((p) => p.trim().replace(/\s+/g, " "))
    .filter((p) => p.length > 0)
}

function parseIntoSentences(content: string): string[] {
  const COMMON_ABBREVIATIONS = [
    'Mr', 'Mrs', 'Ms', 'Dr', 'Prof', 'Sr', 'Jr',
    'W.M', 'S.W', 'J.W', 'S.D', 'J.D', 'Sec', 'Treas',
    'U.S', 'U.K', 'etc', 'vs', 'e.g', 'i.e', 'a.m', 'p.m'
  ]
  
  let normalized = content
    .replace(/\r\n/g, "\n")
    .replace(/\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
  
  const abbrevMap = new Map<string, string>()
  COMMON_ABBREVIATIONS.forEach((abbr, i) => {
    const placeholder = `__ABBR${i}__`
    const pattern = new RegExp(`\\b${abbr.replace(/\./g, '\\.')}`, 'gi')
    normalized = normalized.replace(pattern, placeholder)
    abbrevMap.set(placeholder, abbr)
  })
  
  const sentences = normalized
    .split(/(?<=[.!?])\s+/)
    .map((s) => {
      let restored = s
      abbrevMap.forEach((abbr, placeholder) => {
        restored = restored.replace(new RegExp(placeholder, 'gi'), abbr)
      })
      return restored.trim()
    })
    .filter((s) => s.length > 0)
  
  return sentences
}

function parseCustomChunks(content: string): string[] {
  return content
    .replace(/\r\n/g, "\n")
    .split(/\n\s*---\s*\n/)
    .map((chunk) => chunk.trim().replace(/\n+/g, " ").replace(/\s+/g, " "))
    .filter((chunk) => chunk.length > 0)
}

function generatePreviewChunks(content: string, mode: ChunkMode): Chunk[] {
  let texts: string[]
  
  switch (mode) {
    case "line":
      texts = parseIntoLines(content)
      break
    case "paragraph":
      texts = parseIntoParagraphs(content)
      break
    case "sentence":
      texts = parseIntoSentences(content)
      break
    case "custom":
      texts = parseCustomChunks(content)
      break
    default:
      texts = parseIntoParagraphs(content)
  }
  
  return texts.map((text, index) => ({
    id: generateId(),
    orderIndex: index,
    text,
  }))
}

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

  // Initialize form with existing data
  useEffect(() => {
    if (set) {
      setTitle(set.title)
      setContent(set.content)
      setChunkMode(set.chunkMode)
      setTags(set.tags || [])
    }
  }, [set])

  // Live stats and preview chunks
  const stats = useMemo(() => {
    const trimmed = content.trim()
    if (!trimmed) {
      return { words: 0, lines: 0, paragraphs: 0, sentences: 0, customChunks: 0 }
    }
    
    const words = trimmed.split(/\s+/).filter((w) => w.length > 0).length
    const lines = trimmed.split(/\n/).filter((l) => l.trim().length > 0).length
    const paragraphs = trimmed.split(/\n\s*\n+/).map((p) => p.trim()).filter((p) => p.length > 0).length
    
    const normalized = trimmed.replace(/\r\n/g, "\n").replace(/\n+/g, " ").replace(/\s+/g, " ")
    const sentences = normalized.split(/(?<=[.!?])\s+/).filter((s) => s.length > 0).length
    
    const customChunks = trimmed.split(/\n\s*---\s*\n/).filter((c) => c.trim().length > 0).length
    
    return { words, lines, paragraphs, sentences, customChunks }
  }, [content])
  
  const previewChunks = useMemo(() => {
    return generatePreviewChunks(content, chunkMode)
  }, [content, chunkMode])
  
  const chunks = previewChunks.length

  // Validation
  const isTitleValid = title.trim().length > 0
  const isContentValid = content.trim().length > 0
  const isValid = isTitleValid && isContentValid

  const handleSave = () => {
    if (!isValid) return
    
    updateSet(id, title.trim(), content.trim(), tags)
    if (set && chunkMode !== set.chunkMode) {
      updateChunkMode(id, chunkMode)
    }
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
              <FieldLabel htmlFor="content">Content to Memorize</FieldLabel>
              <Textarea
                id="content"
                placeholder="Paste or type the text you want to memorize. Line breaks will be used to separate paragraphs..."
                className="min-h-[240px] resize-none leading-relaxed"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onBlur={handleContentBlur}
              />
              <FieldDescription>
                Separate paragraphs with blank lines for better chunking
              </FieldDescription>
              {touched.content && !isContentValid && (
                <p className="text-sm text-destructive">Please enter some content</p>
              )}
            </Field>
            
            <Field>
              <FieldLabel>Chunking Method</FieldLabel>
              <RadioGroup value={chunkMode} onValueChange={(value) => setChunkMode(value as ChunkMode)}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex items-center gap-3 rounded-lg border p-3 transition-colors has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5">
                    <RadioGroupItem value="line" id="edit-line" />
                    <Label htmlFor="edit-line" className="flex-1 cursor-pointer font-normal">
                      <div className="flex items-center gap-2 font-medium">
                        <Type className="size-4" />
                        By Line
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">Each line break creates a chunk</div>
                    </Label>
                  </div>
                  
                  <div className="flex items-center gap-3 rounded-lg border p-3 transition-colors has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5">
                    <RadioGroupItem value="paragraph" id="edit-paragraph" />
                    <Label htmlFor="edit-paragraph" className="flex-1 cursor-pointer font-normal">
                      <div className="flex items-center gap-2 font-medium">
                        <FileText className="size-4" />
                        By Paragraph
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">Blank lines create chunks (double Enter)</div>
                    </Label>
                  </div>
                  
                  <div className="flex items-center gap-3 rounded-lg border p-3 transition-colors has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5">
                    <RadioGroupItem value="sentence" id="edit-sentence" />
                    <Label htmlFor="edit-sentence" className="flex-1 cursor-pointer font-normal">
                      <div className="flex items-center gap-2 font-medium">
                        <Layers className="size-4" />
                        By Sentence
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">Split on . ! ? punctuation</div>
                    </Label>
                  </div>
                  
                  <div className="flex items-center gap-3 rounded-lg border p-3 transition-colors has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5">
                    <RadioGroupItem value="custom" id="edit-custom" />
                    <Label htmlFor="edit-custom" className="flex-1 cursor-pointer font-normal">
                      <div className="flex items-center gap-2 font-medium">
                        <Wand2 className="size-4" />
                        Custom
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">Use --- separator to define chunks</div>
                    </Label>
                  </div>
                </div>
              </RadioGroup>
              
              {set && chunkMode !== set.chunkMode && (
                <div className="flex items-start gap-2 rounded-md bg-amber-50 dark:bg-amber-950/20 p-3 text-sm">
                  <AlertCircle className="size-4 text-amber-600 dark:text-amber-500 mt-0.5 shrink-0" />
                  <p className="text-amber-900 dark:text-amber-200">
                    Changing chunk mode will regenerate all chunks. Any progress will be preserved.
                  </p>
                </div>
              )}
              
              {chunkMode === "sentence" && (
                <div className="flex items-start gap-2 rounded-md bg-blue-50 dark:bg-blue-950/20 p-3 text-sm">
                  <AlertCircle className="size-4 text-blue-600 dark:text-blue-500 mt-0.5 shrink-0" />
                  <p className="text-blue-900 dark:text-blue-200">
                    Handles abbreviations like Mr., Dr., W.M., S.W., etc.
                  </p>
                </div>
              )}
              
              {chunkMode === "custom" && (
                <div className="flex items-start gap-2 rounded-md bg-blue-50 dark:bg-blue-950/20 p-3 text-sm">
                  <AlertCircle className="size-4 text-blue-600 dark:text-blue-500 mt-0.5 shrink-0" />
                  <p className="text-blue-900 dark:text-blue-200">
                    Type <code className="px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 font-mono text-xs">---</code> on its own line to manually define chunk boundaries
                  </p>
                </div>
              )}
              
              <FieldDescription>
                Preview your chunks below to see how content will be divided
              </FieldDescription>
            </Field>
            
            {/* Chunk Preview */}
            <ChunkPreview chunks={previewChunks} mode={chunkMode} />
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
                <span className="font-medium tabular-nums">{chunks}</span>
                <span className="text-muted-foreground"> chunk{chunks !== 1 ? "s" : ""}</span>
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
