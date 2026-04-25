"use client"

import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { FileText, List, Layers, Wand2 } from "lucide-react"
import type { ChunkMode } from "@/lib/memorization-context"

interface ChunkPreviewProps {
  chunks: string[]
  mode: ChunkMode
  defaultOpen?: boolean
}

const getModeIcon = (mode: ChunkMode) => {
  switch (mode) {
    case "line":
      return <List className="size-4" />
    case "paragraph":
      return <FileText className="size-4" />
    case "sentence":
      return <Layers className="size-4" />
    case "custom":
      return <Wand2 className="size-4" />
    default:
      return <FileText className="size-4" />
  }
}

const getModeLabel = (mode: ChunkMode) => {
  switch (mode) {
    case "line":
      return "Line"
    case "paragraph":
      return "Paragraph"
    case "sentence":
      return "Sentence"
    case "custom":
      return "Custom"
    default:
      return "Paragraph"
  }
}

export function ChunkPreview({ chunks, mode, defaultOpen = false }: ChunkPreviewProps) {
  if (chunks.length === 0) {
    return null
  }

  return (
    <Accordion type="single" collapsible className="w-full" defaultValue={defaultOpen ? "preview" : undefined}>
      <AccordionItem value="preview">
        <AccordionTrigger className="hover:no-underline">
          <div className="flex items-center gap-2">
            {getModeIcon(mode)}
            <span className="font-medium">
              Chunk Preview ({chunks.length} {getModeLabel(mode).toLowerCase()}{chunks.length !== 1 ? "s" : ""})
            </span>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <ScrollArea className="h-[300px] rounded-md border p-4">
            <div className="space-y-3">
              {chunks.map((chunk, index) => (
                <div
                  key={index}
                  className="group flex gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                >
                  <Badge
                    variant="secondary"
                    className="h-6 shrink-0 rounded-full px-2 py-0.5 text-xs font-medium"
                  >
                    {index + 1}
                  </Badge>
                  <p className="flex-1 text-sm leading-relaxed text-muted-foreground group-hover:text-foreground">
                    {chunk.length > 150 ? `${chunk.substring(0, 150)}...` : chunk}
                  </p>
                </div>
              ))}
            </div>
          </ScrollArea>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
