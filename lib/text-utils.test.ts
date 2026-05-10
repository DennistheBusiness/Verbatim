import { describe, it, expect } from "vitest"
import { toFirstLetterFormat, parseWords, compareTexts } from "./text-utils"

// ─── toFirstLetterFormat ──────────────────────────────────────────────────────

describe("toFirstLetterFormat", () => {
  it("extracts first letter of each word", () => {
    expect(toFirstLetterFormat("Memory under pressure")).toBe("M u p")
  })

  it("preserves capitalization", () => {
    expect(toFirstLetterFormat("Hello World")).toBe("H W")
  })

  it("skips words with no letters (numbers, symbols)", () => {
    expect(toFirstLetterFormat("Hello 123 World")).toBe("H W")
  })

  it("ignores leading punctuation on a word", () => {
    // "world!" → 'w', "(Hello)" → 'H'
    expect(toFirstLetterFormat("(Hello), world!")).toBe("H w")
  })

  it("handles single word", () => {
    expect(toFirstLetterFormat("Hello")).toBe("H")
  })

  it("handles empty string", () => {
    expect(toFirstLetterFormat("")).toBe("")
  })

  it("collapses multiple spaces", () => {
    expect(toFirstLetterFormat("One   Two")).toBe("O T")
  })

  it("real example from docs", () => {
    expect(toFirstLetterFormat("Memory under pressure reveals preparation")).toBe("M u p r p")
  })
})

// ─── parseWords ───────────────────────────────────────────────────────────────

describe("parseWords", () => {
  it("returns word + lowercase firstLetter", () => {
    const result = parseWords("Hello World")
    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({ word: "Hello", firstLetter: "h" })
    expect(result[1]).toEqual({ word: "World", firstLetter: "w" })
  })

  it("skips pure-number tokens", () => {
    const result = parseWords("It 123 works")
    expect(result.map((r) => r.word)).toEqual(["It", "works"])
  })

  it("handles ampersand as a standalone word", () => {
    const result = parseWords("bread & butter")
    const amp = result.find((r) => r.word === "&")
    expect(amp).toBeDefined()
    expect(amp?.firstLetter).toBe("&")
  })

  it("extracts first letter past leading punctuation", () => {
    const result = parseWords("(Hello)")
    expect(result[0].firstLetter).toBe("h")
  })

  it("returns empty array for empty string", () => {
    expect(parseWords("")).toEqual([])
  })

  it("skips symbol-only tokens", () => {
    const result = parseWords("--- hello")
    expect(result.map((r) => r.word)).toEqual(["hello"])
  })
})

// ─── compareTexts ─────────────────────────────────────────────────────────────

describe("compareTexts — exact match", () => {
  it("perfect match returns 100% accuracy", () => {
    const result = compareTexts("hello world", "hello world")
    expect(result.accuracy).toBe(100)
    expect(result.correctCount).toBe(2)
    expect(result.incorrectCount).toBe(0)
    expect(result.mistakes).toHaveLength(0)
  })

  it("case insensitive — 'Hello' matches 'hello'", () => {
    const result = compareTexts("Hello World", "hello world")
    expect(result.accuracy).toBe(100)
  })

  it("punctuation ignored — 'hello,' matches 'hello'", () => {
    const result = compareTexts("hello, world.", "hello world")
    expect(result.accuracy).toBe(100)
  })
})

describe("compareTexts — mismatches", () => {
  it("single typo counts as incorrect, accuracy = 50%", () => {
    const result = compareTexts("helo world", "hello world")
    expect(result.incorrectCount).toBe(1)
    expect(result.correctCount).toBe(1)
    expect(result.accuracy).toBe(50)
    expect(result.mistakes[0].typed).toBe("helo")
    expect(result.mistakes[0].expected).toBe("hello")
  })

  it("missing words reduce accuracy", () => {
    const result = compareTexts("hello", "hello world")
    expect(result.missingCount).toBe(1)
    expect(result.accuracy).toBe(50)
  })

  it("extra words beyond original count as extra", () => {
    const result = compareTexts("hello world extra", "hello world")
    expect(result.extraCount).toBe(1)
    // accuracy = correct (2) / totalExpected (2) = 100%
    expect(result.accuracy).toBe(100)
  })

  it("empty typed string → 0% accuracy", () => {
    const result = compareTexts("", "hello world")
    expect(result.accuracy).toBe(0)
    expect(result.missingCount).toBe(2)
  })

  it("totalExpected matches original word count", () => {
    const result = compareTexts("foo bar baz", "one two three four")
    expect(result.totalExpected).toBe(4)
  })
})

describe("compareTexts — whitespace normalization", () => {
  it("collapses multiple spaces", () => {
    const result = compareTexts("hello  world", "hello world")
    expect(result.accuracy).toBe(100)
  })

  it("handles newlines as word separators", () => {
    const result = compareTexts("hello\nworld", "hello world")
    expect(result.accuracy).toBe(100)
  })
})
