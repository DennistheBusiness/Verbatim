import { describe, it, expect } from "vitest"
import { z } from "zod"
import {
  CHUNK_MODES,
  tagSchema,
  createSetSchema,
  updateSetSchema,
  updateTagsSchema,
  formatZodError,
} from "./schemas"

describe("CHUNK_MODES", () => {
  it("contains the four expected modes", () => {
    expect(CHUNK_MODES).toContain("line")
    expect(CHUNK_MODES).toContain("paragraph")
    expect(CHUNK_MODES).toContain("sentence")
    expect(CHUNK_MODES).toContain("custom")
    expect(CHUNK_MODES).toHaveLength(4)
  })
})

describe("tagSchema", () => {
  it("accepts a valid tag", () => {
    expect(tagSchema.parse("scripture")).toBe("scripture")
  })

  it("trims whitespace", () => {
    expect(tagSchema.parse("  sermon  ")).toBe("sermon")
  })

  it("rejects empty string", () => {
    expect(() => tagSchema.parse("")).toThrow()
  })

  it("rejects tag longer than 50 characters", () => {
    expect(() => tagSchema.parse("a".repeat(51))).toThrow()
  })
})

describe("createSetSchema", () => {
  const valid = {
    title: "The Beatitudes",
    content: "Blessed are the poor in spirit.",
    chunkMode: "paragraph" as const,
    tags: [],
  }

  it("passes valid input", () => {
    const result = createSetSchema.parse(valid)
    expect(result.title).toBe("The Beatitudes")
    expect(result.content).toBe("Blessed are the poor in spirit.")
  })

  it("defaults chunkMode to paragraph", () => {
    const { chunkMode: _, ...rest } = valid
    const result = createSetSchema.parse(rest)
    expect(result.chunkMode).toBe("paragraph")
  })

  it("defaults tags to empty array", () => {
    const { tags: _, ...rest } = valid
    const result = createSetSchema.parse(rest)
    expect(result.tags).toEqual([])
  })

  it("rejects missing title", () => {
    expect(() => createSetSchema.parse({ ...valid, title: "" })).toThrow()
  })

  it("rejects missing content", () => {
    expect(() => createSetSchema.parse({ ...valid, content: "" })).toThrow()
  })

  it("rejects title longer than 200 characters", () => {
    expect(() =>
      createSetSchema.parse({ ...valid, title: "a".repeat(201) })
    ).toThrow()
  })

  it("rejects content longer than 50000 characters", () => {
    expect(() =>
      createSetSchema.parse({ ...valid, content: "a".repeat(50001) })
    ).toThrow()
  })

  it("rejects invalid chunkMode", () => {
    expect(() => createSetSchema.parse({ ...valid, chunkMode: "word" })).toThrow()
  })

  it("accepts all valid chunkMode values", () => {
    for (const mode of CHUNK_MODES) {
      const result = createSetSchema.parse({ ...valid, chunkMode: mode })
      expect(result.chunkMode).toBe(mode)
    }
  })

  it("trims whitespace from title and content", () => {
    const result = createSetSchema.parse({
      ...valid,
      title: "  My Title  ",
      content: "  My Content  ",
    })
    expect(result.title).toBe("My Title")
    expect(result.content).toBe("My Content")
  })

  it("rejects more than 10 tags", () => {
    expect(() =>
      createSetSchema.parse({
        ...valid,
        tags: Array.from({ length: 11 }, (_, i) => `tag${i}`),
      })
    ).toThrow()
  })
})

describe("updateSetSchema", () => {
  it("accepts valid input without chunkMode", () => {
    const result = updateSetSchema.parse({
      title: "Updated Title",
      content: "Updated content.",
    })
    expect(result.title).toBe("Updated Title")
  })

  it("rejects empty title", () => {
    expect(() =>
      updateSetSchema.parse({ title: "", content: "content" })
    ).toThrow()
  })
})

describe("updateTagsSchema", () => {
  it("accepts valid tags array", () => {
    const result = updateTagsSchema.parse({ tags: ["poetry", "wisdom"] })
    expect(result.tags).toEqual(["poetry", "wisdom"])
  })

  it("rejects more than 10 tags", () => {
    expect(() =>
      updateTagsSchema.parse({
        tags: Array.from({ length: 11 }, (_, i) => `tag${i}`),
      })
    ).toThrow()
  })
})

describe("formatZodError", () => {
  it("returns a non-empty string for a ZodError", () => {
    const result = createSetSchema.safeParse({ title: "", content: "" })
    expect(result.success).toBe(false)
    if (!result.success) {
      const msg = formatZodError(result.error)
      expect(typeof msg).toBe("string")
      expect(msg.length).toBeGreaterThan(0)
    }
  })

  it("joins multiple errors with a period and space", () => {
    const err = new z.ZodError([
      { code: "custom", message: "First error", path: [] },
      { code: "custom", message: "Second error", path: [] },
    ])
    expect(formatZodError(err)).toBe("First error. Second error")
  })

  it("returns single message without trailing separator", () => {
    const err = new z.ZodError([
      { code: "custom", message: "Only error", path: [] },
    ])
    expect(formatZodError(err)).toBe("Only error")
  })
})
