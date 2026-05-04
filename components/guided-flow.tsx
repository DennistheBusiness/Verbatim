"use client"

import { Book, Brain, Keyboard, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type FlowStep = "familiarize" | "encode" | "test"

interface GuidedFlowProps {
  recommendedStep: FlowStep
  onFamiliarize: () => void
  onEncode: () => void
  onTest: () => void
}

const steps: Array<{
  id: FlowStep
  title: string
  description: string
  icon: typeof Book
  buttonText: string
}> = [
  {
    id: "familiarize",
    title: "Familiarize",
    description: "Read and understand the material",
    icon: Book,
    buttonText: "Read",
  },
  {
    id: "encode",
    title: "Train",
    description: "First-letter or sorting recall",
    icon: Brain,
    buttonText: "Train",
  },
  {
    id: "test",
    title: "Test",
    description: "Type the full passage from memory",
    icon: Keyboard,
    buttonText: "Test",
  },
]

export function GuidedFlow({
  recommendedStep,
  onFamiliarize,
  onEncode,
  onTest,
}: GuidedFlowProps) {
  const handlers: Record<FlowStep, () => void> = {
    familiarize: onFamiliarize,
    encode: onEncode,
    test: onTest,
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Practice</h2>
      </div>
      
      <div className="flex flex-col gap-3">
        {steps.map((step, index) => {
          const Icon = step.icon
          const isRecommended = step.id === recommendedStep
          
          return (
            <button
              key={step.id}
              onClick={handlers[step.id]}
              className={cn(
                "group flex items-center gap-4 rounded-xl border p-4 text-left transition-colors",
                "hover:bg-accent/50",
                isRecommended 
                  ? "border-primary/50 bg-primary/5" 
                  : "border-border bg-card"
              )}
            >
              <div
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-full",
                  isRecommended
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                <Icon className="size-5" />
              </div>
              
              <div className="flex flex-1 flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    Step {index + 1}
                  </span>
                  {isRecommended && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                      Next
                    </span>
                  )}
                </div>
                <h3 className="font-medium">{step.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {step.description}
                </p>
              </div>
              
              <ArrowRight className={cn(
                "size-5 shrink-0 transition-transform",
                "text-muted-foreground group-hover:translate-x-0.5",
                isRecommended && "text-primary"
              )} />
            </button>
          )
        })}
      </div>
    </div>
  )
}
