import { z } from "zod"

export const CHUNK_MODES = ["line", "paragraph", "sentence", "custom"] as const

export const tagSchema = z
  .string()
  .min(1, "Tag cannot be empty")
  .max(50, "Tag must be 50 characters or fewer")
  .trim()

export const createSetSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be 200 characters or fewer")
    .trim(),
  content: z
    .string()
    .min(1, "Content is required")
    .max(50000, "Content must be 50,000 characters or fewer")
    .trim(),
  chunkMode: z.enum(CHUNK_MODES).default("paragraph"),
  tags: z
    .array(tagSchema)
    .max(10, "Maximum 10 tags allowed")
    .default([]),
})

export const updateSetSchema = createSetSchema
  .omit({ chunkMode: true })
  .partial()
  .extend({
    title: z
      .string()
      .min(1, "Title is required")
      .max(200, "Title must be 200 characters or fewer")
      .trim(),
    content: z
      .string()
      .min(1, "Content is required")
      .max(50000, "Content must be 50,000 characters or fewer")
      .trim(),
  })

export const updateTagsSchema = z.object({
  tags: z
    .array(tagSchema)
    .max(10, "Maximum 10 tags allowed"),
})

export type CreateSetInput = z.infer<typeof createSetSchema>
export type UpdateSetInput = z.infer<typeof updateSetSchema>

/**
 * Returns a single user-friendly string from a ZodError.
 */
export function formatZodError(err: z.ZodError): string {
  return err.errors.map((e) => e.message).join(". ")
}
