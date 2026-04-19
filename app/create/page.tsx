"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Field, FieldGroup, FieldLabel, FieldDescription } from "@/components/ui/field"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Header } from "@/components/header"
import { useMemorization, type ChunkMode } from "@/lib/memorization-context"
import { FileText, Type, Layers } from "lucide-react"

export default function CreatePage() {
  const router = useRouter()
  const { addSet } = useMemorization()
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [chunkMode, setChunkMode] = useState<ChunkMode>("paragraph")
  const [touched, setTouched] = useState({ title: false, content: false })

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

  const handleSave = () => {
    if (!isValid) return
    
    const id = addSet(title.trim(), content.trim(), chunkMode)
    router.push(`/memorization/${id}`)
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
                <div className="flex items-center gap-3">
                  <div className="flex flex-1 items-center gap-3 rounded-lg border p-3 transition-colors has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5">
                    <RadioGroupItem value="paragraph" id="paragraph" />
                    <Label htmlFor="paragraph" className="flex-1 cursor-pointer font-normal">
                      <div className="font-medium">By Paragraph</div>
                      <div className="text-xs text-muted-foreground">Split on line breaks</div>
                    </Label>
                  </div>
                  <div className="flex flex-1 items-center gap-3 rounded-lg border p-3 transition-colors has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5">
                    <RadioGroupItem value="sentence" id="sentence" />
                    <Label htmlFor="sentence" className="flex-1 cursor-pointer font-normal">
                      <div className="font-medium">By Sentence</div>
                      <div className="text-xs text-muted-foreground">Split on punctuation</div>
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
