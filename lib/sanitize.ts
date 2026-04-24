/**
 * Sanitizes user-supplied text to prevent stored XSS.
 * Strips all HTML tags and decodes common HTML entities, leaving only plain text.
 */
export function sanitizeText(input: string): string {
  if (typeof input !== "string") return ""

  return input
    .replace(/<[^>]*>/g, "")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#x27;/gi, "'")
    .replace(/&#x2F;/gi, "/")
    .replace(/&nbsp;/gi, " ")
}

/**
 * Sanitizes an array of tag strings.
 */
export function sanitizeTags(tags: string[]): string[] {
  return tags.map(sanitizeText).filter((t) => t.length > 0)
}
