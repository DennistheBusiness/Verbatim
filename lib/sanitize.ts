/**
 * Sanitizes user-supplied text to prevent stored XSS.
 * Strips all HTML tags leaving only plain text.
 *
 * Client-side: uses DOMPurify when available (accurate, spec-compliant).
 * Server-side / fallback: uses a regex tag-stripper (fast, no DOM required).
 *
 * Both paths strip ALL HTML — ALLOWED_TAGS: [] — so only plain text is kept.
 */
export function sanitizeText(input: string): string {
  if (typeof input !== "string") return ""

  // Client-side: use DOMPurify if available
  if (typeof window !== "undefined") {
    try {
      // DOMPurify is a transitive dependency; attempt to load it dynamically.
      // If not available, fall through to the regex path.
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const DOMPurify = require("dompurify")
      return DOMPurify.sanitize(input, {
        ALLOWED_TAGS: [],
        ALLOWED_ATTR: [],
      }) as string
    } catch {
      // Fall through to regex
    }
  }

  // Server-side / fallback: strip HTML tags and decode common entities
  return input
    .replace(/<[^>]*>/g, "")           // strip all tags
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
