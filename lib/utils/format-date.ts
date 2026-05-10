import type { ChunkMode } from "@/lib/memorization-context"

export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  const year = date.getFullYear()
  return `${month}/${day}/${year}`
}

export function getChunkLabel(mode: ChunkMode, count: number): string {
  const plural = count !== 1 ? "s" : ""
  switch (mode) {
    case "line":
      return `line${plural}`
    case "paragraph":
      return `paragraph${plural}`
    case "sentence":
      return `sentence${plural}`
    case "custom":
      return `chunk${plural}`
    default:
      return `chunk${plural}`
  }
}
