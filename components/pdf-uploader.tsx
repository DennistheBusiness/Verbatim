"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import * as pdfjsLib from "pdfjs-dist"
import { Upload, FileText, Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"

// Configure PDF.js worker
if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`
}

interface PDFUploaderProps {
  onExtractComplete: (text: string, filename: string) => void
}

export function PDFUploader({ onExtractComplete }: PDFUploaderProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [extractedText, setExtractedText] = useState("")
  const [filename, setFilename] = useState("")
  const [error, setError] = useState("")
  const [progress, setProgress] = useState(0)

  const extractTextFromPDF = async (file: File) => {
    setIsProcessing(true)
    setError("")
    setProgress(0)
    
    try {
      // Read file as ArrayBuffer
      const arrayBuffer = await file.arrayBuffer()
      
      // Load PDF document
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
      const numPages = pdf.numPages
      
      let fullText = ""
      
      // Extract text from each page
      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        const page = await pdf.getPage(pageNum)
        const textContent = await page.getTextContent()
        
        // Combine text items
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(" ")
        
        fullText += pageText + "\n\n"
        
        // Update progress
        setProgress(Math.round((pageNum / numPages) * 100))
      }
      
      // Clean up text
      const cleanedText = fullText
        .replace(/\s+/g, " ")  // Replace multiple spaces
        .replace(/\n\s*\n\s*\n/g, "\n\n")  // Remove excessive line breaks
        .trim()
      
      if (!cleanedText) {
        throw new Error("No text could be extracted from the PDF")
      }
      
      setExtractedText(cleanedText)
      setFilename(file.name)
      toast.success(`Extracted ${cleanedText.split(/\s+/).length} words from ${file.name}`)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to extract text from PDF"
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsProcessing(false)
      setProgress(0)
    }
  }

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    // Validate file type
    if (file.type !== "application/pdf") {
      setError("Please upload a PDF file")
      toast.error("Please upload a PDF file")
      return
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      setError("PDF file size must be less than 10MB")
      toast.error("PDF file size must be less than 10MB")
      return
    }

    extractTextFromPDF(file)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
    },
    maxFiles: 1,
    multiple: false,
  })

  const handleConfirm = () => {
    if (extractedText && filename) {
      onExtractComplete(extractedText, filename)
      // Reset state
      setExtractedText("")
      setFilename("")
      setError("")
    }
  }

  const handleCancel = () => {
    setExtractedText("")
    setFilename("")
    setError("")
  }

  // Show preview if text is extracted
  if (extractedText) {
    const wordCount = extractedText.split(/\s+/).length
    const charCount = extractedText.length

    return (
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2 text-green-600">
          <CheckCircle2 className="size-5" />
          <div>
            <p className="font-medium">{filename}</p>
            <p className="text-sm text-muted-foreground">
              {wordCount.toLocaleString()} words · {charCount.toLocaleString()} characters
            </p>
          </div>
        </div>

        <div className="max-h-[300px] overflow-y-auto rounded-md border p-4 text-sm">
          <p className="whitespace-pre-wrap">{extractedText.substring(0, 1000)}</p>
          {extractedText.length > 1000 && (
            <p className="mt-2 text-muted-foreground italic">
              ... and {(extractedText.length - 1000).toLocaleString()} more characters
            </p>
          )}
        </div>

        <div className="flex gap-2">
          <Button onClick={handleConfirm} className="flex-1">
            Use This Text
          </Button>
          <Button onClick={handleCancel} variant="outline">
            Cancel
          </Button>
        </div>
      </Card>
    )
  }

  // Show upload area
  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-12 text-center cursor-pointer
          transition-colors duration-200
          ${isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"}
          ${isProcessing ? "pointer-events-none opacity-50" : ""}
        `}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center gap-4">
          {isProcessing ? (
            <>
              <Loader2 className="size-12 text-primary animate-spin" />
              <div className="space-y-2">
                <p className="text-lg font-medium">Extracting text from PDF...</p>
                <p className="text-sm text-muted-foreground">{progress}% complete</p>
              </div>
            </>
          ) : (
            <>
              <div className="rounded-full bg-primary/10 p-4">
                <Upload className="size-8 text-primary" />
              </div>
              <div className="space-y-2">
                <p className="text-lg font-medium">
                  {isDragActive ? "Drop your PDF here" : "Upload a PDF"}
                </p>
                <p className="text-sm text-muted-foreground">
                  Drag and drop or click to browse
                </p>
                <p className="text-xs text-muted-foreground">
                  Maximum file size: 10MB
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="p-4 bg-muted/50">
        <div className="flex gap-3">
          <FileText className="size-5 text-muted-foreground shrink-0 mt-0.5" />
          <div className="text-sm space-y-1">
            <p className="font-medium">How it works:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Upload a PDF document (up to 10MB)</li>
              <li>Text is extracted automatically</li>
              <li>Preview and confirm the extracted content</li>
              <li>Choose your chunking method and start memorizing</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  )
}
