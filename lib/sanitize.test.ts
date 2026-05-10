import { describe, it, expect } from "vitest"
import { sanitizeText, sanitizeTags } from "./sanitize"

describe("sanitizeText", () => {
  it("returns empty string for non-string input", () => {
    // @ts-expect-error intentional bad input
    expect(sanitizeText(null)).toBe("")
    // @ts-expect-error intentional bad input
    expect(sanitizeText(undefined)).toBe("")
    // @ts-expect-error intentional bad input
    expect(sanitizeText(123)).toBe("")
  })

  it("passes through plain text unchanged", () => {
    expect(sanitizeText("Hello, world!")).toBe("Hello, world!")
  })

  it("strips basic HTML tags", () => {
    expect(sanitizeText("<b>bold</b>")).toBe("bold")
    expect(sanitizeText("<p>paragraph</p>")).toBe("paragraph")
    expect(sanitizeText("<em>italic</em>")).toBe("italic")
  })

  it("strips script tags", () => {
    expect(sanitizeText('<script>alert("xss")</script>')).toBe('alert("xss")')
  })

  it("strips nested tags", () => {
    expect(sanitizeText("<div><span>text</span></div>")).toBe("text")
  })

  it("decodes &amp;", () => {
    expect(sanitizeText("bread &amp; butter")).toBe("bread & butter")
  })

  it("decodes &lt; and &gt;", () => {
    expect(sanitizeText("&lt;tag&gt;")).toBe("<tag>")
  })

  it("decodes &quot;", () => {
    expect(sanitizeText("say &quot;hello&quot;")).toBe('say "hello"')
  })

  it("decodes &#x27; (single quote)", () => {
    expect(sanitizeText("it&#x27;s")).toBe("it's")
  })

  it("decodes &#x2F; (forward slash)", () => {
    expect(sanitizeText("a&#x2F;b")).toBe("a/b")
  })

  it("decodes &nbsp;", () => {
    expect(sanitizeText("hello&nbsp;world")).toBe("hello world")
  })

  it("handles empty string", () => {
    expect(sanitizeText("")).toBe("")
  })

  it("is case-insensitive for entity names", () => {
    expect(sanitizeText("&AMP;")).toBe("&")
    expect(sanitizeText("&LT;")).toBe("<")
  })
})

describe("sanitizeTags", () => {
  it("maps sanitizeText over each tag", () => {
    expect(sanitizeTags(["<b>bold</b>", "normal"])).toEqual(["bold", "normal"])
  })

  it("filters out empty strings after sanitization", () => {
    // A tag that sanitizes to empty ("<b></b>" → "")
    expect(sanitizeTags(["<b></b>", "valid"])).toEqual(["valid"])
  })

  it("returns empty array for empty input", () => {
    expect(sanitizeTags([])).toEqual([])
  })

  it("handles already-clean tags unchanged", () => {
    expect(sanitizeTags(["scripture", "poetry"])).toEqual(["scripture", "poetry"])
  })
})
