"use client"

import { useState } from "react"
import { X, Plus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface CategoryInputProps {
  categories: string[]
  onChange: (categories: string[]) => void
  suggestions?: string[]
}

export function CategoryInput({ categories, onChange, suggestions = [] }: CategoryInputProps) {
  const [inputValue, setInputValue] = useState("")

  const handleAddCategory = () => {
    const trimmed = inputValue.trim()
    if (trimmed && !categories.includes(trimmed)) {
      onChange([...categories, trimmed])
      setInputValue("")
    }
  }

  const handleRemoveCategory = (categoryToRemove: string) => {
    onChange(categories.filter((cat) => cat !== categoryToRemove))
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleAddCategory()
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    if (!categories.includes(suggestion)) {
      onChange([...categories, suggestion])
    }
  }

  const availableSuggestions = suggestions.filter(
    (suggestion) => !categories.includes(suggestion)
  )

  return (
    <div className="flex flex-col gap-3">
      {/* Input field */}
      <div className="flex gap-2">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a category..."
          className="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleAddCategory}
          disabled={!inputValue.trim()}
        >
          <Plus className="size-4" />
          <span className="sr-only">Add category</span>
        </Button>
      </div>

      {/* Selected categories */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <Badge key={category} variant="secondary" className="gap-1.5 pl-3 pr-2">
              {category}
              <button
                type="button"
                onClick={() => handleRemoveCategory(category)}
                className="rounded-full hover:bg-muted-foreground/20 transition-colors"
              >
                <X className="size-3" />
                <span className="sr-only">Remove {category}</span>
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Suggestions */}
      {availableSuggestions.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-muted-foreground">Suggested categories:</p>
          <div className="flex flex-wrap gap-2">
            {availableSuggestions.slice(0, 5).map((suggestion) => (
              <Badge
                key={suggestion}
                variant="outline"
                className="cursor-pointer hover:bg-accent transition-colors"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                <Plus className="size-3 mr-1" />
                {suggestion}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
