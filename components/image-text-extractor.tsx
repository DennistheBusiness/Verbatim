"use client"

import { useState, useCallback, useRef } from "react"
import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ImageIcon, Camera, Loader2, RotateCcw, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"

interface ImageTextExtractorProps {
  onComplete: (text: string) => void
}

type State = "idle" | "processing" | "done"

export function ImageTextExtractor({ onComplete }: ImageTextExtractorProps) {
  const [state, setState] = useState<State>("idle")
  const [extractedText, setExtractedText] = useState("")
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const runExtraction = useCallback(async (file: File) => {
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    setState("processing")

    try {
      const formData = new FormData()
      formData.append("image", file)

      const res = await fetch("/api/extract-text", { method: "POST", body: formData })
      const data = await res.json()

      if (!res.ok || data.error) {
        toast.error(data.error ?? "Failed to extract text")
        setState("idle")
        URL.revokeObjectURL(url)
        setPreviewUrl(null)
        return
      }

      setExtractedText(data.text ?? "")
      setState("done")
    } catch {
      toast.error("Something went wrong. Please try again.")
      setState("idle")
      URL.revokeObjectURL(url)
      setPreviewUrl(null)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "image/*": [".jpg", ".jpeg", ".png", ".webp", ".gif"] },
    maxSize: 10 * 1024 * 1024,
    multiple: false,
    disabled: state !== "idle",
    onDropAccepted: ([file]) => runExtraction(file),
    onDropRejected: ([rejection]) => {
      const msg = rejection.errors[0]?.code === "file-too-large"
        ? "Image must be under 10 MB"
        : "Unsupported file type"
      toast.error(msg)
    },
  })

  const handleCameraChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) runExtraction(file)
    e.target.value = ""
  }

  const handleReset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
    setExtractedText("")
    setState("idle")
  }

  const handleUse = () => {
    onComplete(extractedText)
    handleReset()
  }

  if (state === "processing") {
    return (
      <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-muted/30 p-8">
        {previewUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewUrl} alt="Uploading" className="max-h-40 rounded-lg object-contain opacity-60" />
        )}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Extracting text with AI…
        </div>
      </div>
    )
  }

  if (state === "done") {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-sm font-medium text-green-600 dark:text-green-400">
          <CheckCircle2 className="size-4" />
          Text extracted — review and edit below
        </div>
        <Textarea
          value={extractedText}
          onChange={(e) => setExtractedText(e.target.value)}
          className="min-h-[160px] resize-none leading-relaxed"
          placeholder="No text was found in the image"
        />
        <div className="flex gap-2">
          <Button className="flex-1" onClick={handleUse} disabled={!extractedText.trim()}>
            Use This Text
          </Button>
          <Button variant="outline" onClick={handleReset} className="gap-1.5">
            <RotateCcw className="size-4" />
            Try Another
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Dropzone */}
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
            {isDragActive ? "Drop image here" : "Drop image or tap to browse"}
          </p>
          <p className="text-xs text-muted-foreground">JPG, PNG, WEBP, GIF · Max 10 MB</p>
        </div>
      </div>

      {/* Camera shortcut for mobile */}
      <Button
        variant="outline"
        className="w-full gap-2"
        onClick={() => cameraInputRef.current?.click()}
      >
        <Camera className="size-4" />
        Take Photo
      </Button>
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleCameraChange}
      />
    </div>
  )
}
