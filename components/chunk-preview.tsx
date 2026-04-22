"use client"

import { type ChunkMode, type Chunk } from "@/lib/memorization-context"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion"
import { FileText, Type, Layers, Wand2 } from "lucide-react"

interface ChunkPreviewProps {
  chunks: Chunk[]
  mode: ChunkMode
}

const MODE_LABELS: Record<ChunkMode, { label: string; icon: typeof FileText }> = {
  line: { label: "By Line", icon: Type },
  paragraph: { label: "By Paragraph", icon: FileText },
  sentence: { label: "By Sentence", icon: Layers },
  custom: { label: "Custom", icon: Wand2 }
}

export function ChunkPreview({ chunks, mode }: ChunkPreviewProps) {
  const { label, icon: Icon } = MODE_LABELS[mode]
  
  if (chunks.length === 0) {
    return (
      <div className="rounded-lg border bg-muted/50 p-8 text-center">
        <FileText className="mx-auto mb-3 size-10 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">
          Enter content to see chunks
        </p>
      </div>
    )
  }

  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="preview" className="border rounded-lg">
        <AccordionTrigger className="px-4 hover:no-underline">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Icon className="size-4 text-muted-foreground" />
              <span className="text-sm font-medium">
                Preview {chunks.length} {chunks.length === 1 ? 'chunk' : 'chunks'}
              </span>
            </div>
            <Badge variant="secondary" className="text-xs">
              {label}
            </Badge>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-4 pb-4">
          <ScrollArea className="h-[300px] w-full rounded-md border">
            <div className="space-y-2 p-4">
              {chunks.map((chunk, i) => (
                <div
                  key={chunk.id}
                  className="group relative rounded-md bg-muted/50 p-3 text-sm hover:bg-muted transition-colors"
                >
                  <Badge 
                    variant="outline" 
                    className="absolute -top-2 -left-2 size-6 justify-center p-0 text-xs font-mono"
                  >
                    {i + 1}
                  </Badge>
                  <p className="text-foreground/80 leading-relaxed pl-4">
                    {chunk.text.length > 150 
                      ? `${chunk.text.slice(0, 150)}...` 
                      : chunk.text}
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
