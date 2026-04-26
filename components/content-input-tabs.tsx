"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Mic, Type, ImageIcon } from "lucide-react"

export type InputMethod = "text" | "voice" | "image"

interface ContentInputTabsProps {
  activeTab: InputMethod
  onTabChange: (tab: InputMethod) => void
  textContent: React.ReactNode
  voiceContent: React.ReactNode
  imageContent: React.ReactNode
}

export function ContentInputTabs({
  activeTab,
  onTabChange,
  textContent,
  voiceContent,
  imageContent,
}: ContentInputTabsProps) {
  return (
    <Tabs value={activeTab} onValueChange={(value) => onTabChange(value as InputMethod)} className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="text" className="gap-2">
          <Type className="size-4" />
          <span className="hidden sm:inline">Type Text</span>
          <span className="sm:hidden">Text</span>
        </TabsTrigger>
        <TabsTrigger value="voice" className="gap-2">
          <Mic className="size-4" />
          <span className="hidden sm:inline">Voice Recording</span>
          <span className="sm:hidden">Voice</span>
        </TabsTrigger>
        <TabsTrigger value="image" className="gap-2">
          <ImageIcon className="size-4" />
          <span className="hidden sm:inline">Image to Text</span>
          <span className="sm:hidden">Image</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="text" className="mt-4">
        {textContent}
      </TabsContent>

      <TabsContent value="voice" className="mt-4">
        {voiceContent}
      </TabsContent>

      <TabsContent value="image" className="mt-4">
        {imageContent}
      </TabsContent>
    </Tabs>
  )
}
