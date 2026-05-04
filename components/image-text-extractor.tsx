"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ImageIcon, Camera, Loader2, RotateCcw, CheckCircle2, ArrowUp, ArrowDown, Trash2, GripVertical } from "lucide-react"
import { toast } from "sonner"

interface ImageTextExtractorProps {
  onComplete: (text: string) => void
}

type ImageStatus = "queued" | "processing" | "done" | "error"

interface ImageJob {
  id: string
  file: File
  previewUrl: string
  status: ImageStatus
  extractedText: string
  error: string | null
}

const MAX_IMAGES = 5

export function ImageTextExtractor({ onComplete }: ImageTextExtractorProps) {
  const [imageJobs, setImageJobs] = useState<ImageJob[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [isPreparing, setIsPreparing] = useState(false)
  const [extractedText, setExtractedText] = useState("")
  const [previewJobId, setPreviewJobId] = useState<string | null>(null)
  const [draggingJobId, setDraggingJobId] = useState<string | null>(null)
  const [dragOverJobId, setDragOverJobId] = useState<string | null>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const previewJob = imageJobs.find((job) => job.id === previewJobId) ?? null

  useEffect(() => {
    return () => {
      imageJobs.forEach((job) => URL.revokeObjectURL(job.previewUrl))
    }
  }, [imageJobs])

  const runSingleExtraction = useCallback(async (file: File) => {
    const formData = new FormData()
    formData.append("image", file)

    const res = await fetch("/api/extract-text", { method: "POST", body: formData })
    const data = await res.json()

    if (!res.ok || data.error) {
      return {
        ok: false,
        text: "",
        error: data.error ?? "Failed to extract text",
      }
    }

    return {
      ok: true,
      text: data.text ?? "",
      error: null,
    }
  }, [])

  const isHeicOrHeif = (file: File) => {
    const type = (file.type || "").toLowerCase()
    const name = file.name.toLowerCase()
    return (
      type.includes("heic") ||
      type.includes("heif") ||
      name.endsWith(".heic") ||
      name.endsWith(".heif")
    )
  }

  const convertHeicToJpeg = useCallback(async (file: File): Promise<File> => {
    const formData = new FormData()
    formData.append("image", file)

    const response = await fetch("/api/normalize-image", {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      throw new Error("Failed to normalize HEIC image")
    }

    const convertedBlob = await response.blob()
    const nextName = file.name.replace(/\.(heic|heif)$/i, ".jpg")
    return new File([convertedBlob], nextName, {
      type: "image/jpeg",
      lastModified: file.lastModified,
    })
  }, [])

  const addFiles = useCallback(async (files: File[]) => {
    if (files.length === 0) return

    if (imageJobs.length >= MAX_IMAGES) {
      toast.error(`You can add up to ${MAX_IMAGES} images at a time`)
      return
    }

    const availableSlots = MAX_IMAGES - imageJobs.length
    const acceptedFiles = files.slice(0, availableSlots)
    const skippedCount = files.length - acceptedFiles.length

    setIsPreparing(true)

    const processedFiles: File[] = []
    let conversionFailures = 0

    for (const file of acceptedFiles) {
      if (!isHeicOrHeif(file)) {
        processedFiles.push(file)
        continue
      }

      try {
        const convertedFile = await convertHeicToJpeg(file)
        processedFiles.push(convertedFile)
      } catch {
        conversionFailures += 1
      }
    }

    const newJobs: ImageJob[] = processedFiles.map((file) => ({
      id: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2, 8)}`,
      file,
      previewUrl: URL.createObjectURL(file),
      status: "queued",
      extractedText: "",
      error: null,
    }))

    setImageJobs((prev) => [...prev, ...newJobs])
    setIsPreparing(false)

    if (skippedCount > 0) {
      toast.error(`Only ${MAX_IMAGES} images are allowed`)
    }
    if (conversionFailures > 0) {
      toast.error(`Could not process ${conversionFailures} HEIC image${conversionFailures !== 1 ? "s" : ""}`)
    }
  }, [convertHeicToJpeg, imageJobs.length])

  const removeImage = (id: string) => {
    setImageJobs((prev) => {
      const target = prev.find((job) => job.id === id)
      if (target) URL.revokeObjectURL(target.previewUrl)
      return prev.filter((job) => job.id !== id)
    })
  }

  const moveImage = (index: number, direction: "up" | "down") => {
    setImageJobs((prev) => {
      const next = [...prev]
      const targetIndex = direction === "up" ? index - 1 : index + 1
      if (targetIndex < 0 || targetIndex >= next.length) return prev
      const [item] = next.splice(index, 1)
      next.splice(targetIndex, 0, item)
      return next
    })
  }

  const reorderById = (fromId: string, toId: string) => {
    if (fromId === toId) return
    setImageJobs((prev) => {
      const fromIndex = prev.findIndex((job) => job.id === fromId)
      const toIndex = prev.findIndex((job) => job.id === toId)
      if (fromIndex < 0 || toIndex < 0) return prev

      const next = [...prev]
      const [moved] = next.splice(fromIndex, 1)
      next.splice(toIndex, 0, moved)
      return next
    })
  }

  const startTouchDrag = (jobId: string) => {
    if (isProcessing) return
    setDraggingJobId(jobId)
    setDragOverJobId(jobId)
  }

  useEffect(() => {
    if (!draggingJobId || isProcessing) return

    const handleTouchMove = (event: TouchEvent) => {
      const touch = event.touches[0]
      if (!touch) return

      event.preventDefault()

      const element = document.elementFromPoint(touch.clientX, touch.clientY)
      const row = element?.closest('[data-image-job-id]') as HTMLElement | null
      const targetId = row?.dataset.imageJobId ?? null

      if (!targetId) return
      setDragOverJobId(targetId)

      if (targetId !== draggingJobId) {
        reorderById(draggingJobId, targetId)
      }
    }

    const handleTouchEnd = () => {
      setDraggingJobId(null)
      setDragOverJobId(null)
    }

    window.addEventListener('touchmove', handleTouchMove, { passive: false })
    window.addEventListener('touchend', handleTouchEnd)
    window.addEventListener('touchcancel', handleTouchEnd)

    return () => {
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleTouchEnd)
      window.removeEventListener('touchcancel', handleTouchEnd)
    }
  }, [draggingJobId, isProcessing])

  const handleExtractAll = useCallback(async () => {
    if (imageJobs.length === 0 || isProcessing) return

    setIsProcessing(true)
    setExtractedText("")
    setImageJobs((prev) => prev.map((job) => ({ ...job, status: "queued", extractedText: "", error: null })))

    try {
      const nextJobs = [...imageJobs]

      for (let index = 0; index < nextJobs.length; index++) {
        const current = nextJobs[index]

        setImageJobs((prev) => prev.map((job) =>
          job.id === current.id ? { ...job, status: "processing", error: null } : job
        ))

        const result = await runSingleExtraction(current.file)

        if (result.ok) {
          nextJobs[index] = {
            ...current,
            status: "done",
            extractedText: result.text,
            error: null,
          }
        } else {
          nextJobs[index] = {
            ...current,
            status: "error",
            extractedText: "",
            error: result.error,
          }
        }

        setImageJobs((prev) => prev.map((job) => (job.id === nextJobs[index].id ? nextJobs[index] : job)))
      }

      const combined = nextJobs
        .filter((job) => job.status === "done")
        .map((job) => job.extractedText.trim())
        .filter(Boolean)
        .join("\n\n")

      setExtractedText(combined)

      const successCount = nextJobs.filter((job) => job.status === "done").length
      const failedCount = nextJobs.filter((job) => job.status === "error").length

      if (successCount > 0 && failedCount === 0) {
        toast.success(`Extracted text from ${successCount} image${successCount !== 1 ? "s" : ""}`)
      } else if (successCount > 0 && failedCount > 0) {
        toast.warning(`Extracted ${successCount}, failed ${failedCount}. Review results below.`)
      } else {
        toast.error("Could not extract text from the selected images")
      }
    } catch {
      toast.error("Something went wrong. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }, [imageJobs, isProcessing, runSingleExtraction])

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    accept: { "image/*": [".jpg", ".jpeg", ".png", ".webp", ".gif", ".heic", ".heif"] },
    maxSize: 10 * 1024 * 1024,
    multiple: true,
    noClick: true,
    onDropAccepted: (files) => { void addFiles(files) },
    onDropRejected: (rejections) => {
      const firstErrorCode = rejections[0]?.errors[0]?.code
      const msg = firstErrorCode === "file-too-large"
        ? "Each image must be under 10 MB"
        : firstErrorCode === "too-many-files"
          ? `You can add up to ${MAX_IMAGES} images`
          : "Unsupported file type"
      toast.error(msg)
    },
  })

  const handleCameraChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    void addFiles(files)
    e.target.value = ""
  }

  const handleResetAll = () => {
    imageJobs.forEach((job) => URL.revokeObjectURL(job.previewUrl))
    setImageJobs([])
    setExtractedText("")
  }

  const handleUse = () => {
    onComplete(extractedText)
    handleResetAll()
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2 rounded-xl border border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
        <span>{imageJobs.length}/{MAX_IMAGES} images selected</span>
        <span>Drag handle (mobile) or use arrows</span>
      </div>

      <div
        {...getRootProps()}
        className={`flex flex-col items-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors cursor-pointer ${
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-border hover:border-muted-foreground/40 hover:bg-accent/30"
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex size-12 items-center justify-center rounded-full bg-muted">
          <ImageIcon className="size-6 text-muted-foreground" />
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium">
            {isDragActive ? "Drop images here" : "Drop images here"}
          </p>
          <p className="text-xs text-muted-foreground">JPG, PNG, WEBP, GIF, HEIC · Up to 5 images · 10 MB each</p>
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={open}
          disabled={isProcessing || isPreparing || imageJobs.length >= MAX_IMAGES}
        >
          {isPreparing ? "Preparing..." : "Browse Images"}
        </Button>

        <Button
          type="button"
          variant="outline"
          className="flex-1 gap-2"
          onClick={() => cameraInputRef.current?.click()}
          disabled={isProcessing || isPreparing || imageJobs.length >= MAX_IMAGES}
        >
          <Camera className="size-4" />
          Take Photo
        </Button>
      </div>

      {imageJobs.length > 0 && (
        <div className="rounded-xl border border-border">
          {imageJobs.map((job, index) => (
            <div
              key={job.id}
              data-image-job-id={job.id}
              className={`flex items-center gap-3 border-b border-border px-3 py-3 last:border-b-0 transition-colors ${
                dragOverJobId === job.id ? "bg-primary/5" : ""
              }`}
              draggable={!isProcessing}
              onDragStart={(e) => {
                setDraggingJobId(job.id)
                e.dataTransfer.effectAllowed = "move"
                e.dataTransfer.setData("text/plain", job.id)
              }}
              onDragOver={(e) => {
                e.preventDefault()
                if (!isProcessing) {
                  e.dataTransfer.dropEffect = "move"
                  setDragOverJobId(job.id)
                }
              }}
              onDragLeave={() => {
                setDragOverJobId((prev) => (prev === job.id ? null : prev))
              }}
              onDrop={(e) => {
                e.preventDefault()
                if (isProcessing) return
                const sourceId = e.dataTransfer.getData("text/plain") || draggingJobId
                if (sourceId) reorderById(sourceId, job.id)
                setDraggingJobId(null)
                setDragOverJobId(null)
              }}
              onDragEnd={() => {
                setDraggingJobId(null)
                setDragOverJobId(null)
              }}
            >
              <button
                type="button"
                className="text-muted-foreground/70 touch-none"
                aria-label={`Reorder ${job.file.name}`}
                title="Drag to reorder"
                onTouchStart={() => startTouchDrag(job.id)}
                disabled={isProcessing}
              >
                <GripVertical className="size-4" />
              </button>

              <button
                type="button"
                className="size-12 overflow-hidden rounded-md bg-muted ring-offset-background transition hover:ring-2 hover:ring-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                onClick={() => setPreviewJobId(job.id)}
                aria-label={`Preview ${job.file.name}`}
                title="Click to preview"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={job.previewUrl} alt={job.file.name} className="h-full w-full object-cover" />
              </button>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{index + 1}. {job.file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {job.status === "processing" && "Extracting..."}
                  {job.status === "done" && "Ready"}
                  {job.status === "error" && (job.error || "Failed")}
                  {job.status === "queued" && "Queued"}
                </p>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() => moveImage(index, "up")}
                  disabled={isProcessing || index === 0}
                >
                  <ArrowUp className="size-4" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() => moveImage(index, "down")}
                  disabled={isProcessing || index === imageJobs.length - 1}
                >
                  <ArrowDown className="size-4" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() => removeImage(job.id)}
                  disabled={isProcessing}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <Button
          type="button"
          className="flex-1"
          onClick={handleExtractAll}
          disabled={isProcessing || isPreparing || imageJobs.length === 0}
        >
          {isProcessing ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="size-4 animate-spin" />
              Extracting...
            </span>
          ) : (
            "Extract in This Order"
          )}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={handleResetAll}
          className="gap-1.5"
          disabled={isProcessing && imageJobs.length === 0}
        >
          <RotateCcw className="size-4" />
          Reset
        </Button>
      </div>

      {(extractedText || imageJobs.some((job) => job.status === "done")) && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-sm font-medium text-green-600 dark:text-green-400">
            <CheckCircle2 className="size-4" />
            Text extracted — review and edit below
          </div>
          <Textarea
            value={extractedText}
            onChange={(e) => setExtractedText(e.target.value)}
            className="min-h-[180px] resize-none leading-relaxed"
            placeholder="No text was found in the selected images"
          />
          <Button className="w-full" onClick={handleUse} disabled={!extractedText.trim()}>
            Use This Text
          </Button>
        </div>
      )}

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*,.heic,.heif"
        capture="environment"
        multiple
        className="hidden"
        onChange={handleCameraChange}
      />

      {previewJob && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Image preview"
          onClick={() => setPreviewJobId(null)}
        >
          <div className="w-full max-w-3xl rounded-xl bg-background p-3" onClick={(e) => e.stopPropagation()}>
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="truncate text-sm font-medium">{previewJob.file.name}</p>
              <Button type="button" variant="outline" size="sm" onClick={() => setPreviewJobId(null)}>
                Close
              </Button>
            </div>
            <div className="max-h-[75vh] overflow-auto rounded-lg border bg-muted/20 p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewJob.previewUrl} alt={previewJob.file.name} className="mx-auto h-auto max-w-full rounded-md object-contain" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
