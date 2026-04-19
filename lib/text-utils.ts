/**
 * Converts text to first-letter format for memory aid display.
 * 
 * Examples:
 * - "Memory under pressure reveals preparation" → "M u p r p"
 * - "Hello, world! How are you?" → "H w H a y"
 * - "It's a beautiful day." → "I a b d"
 * 
 * Rules:
 * - Extracts the first letter of each word
 * - Ignores leading punctuation (quotes, parentheses, etc.)
 * - Preserves original capitalization for better visual scanning
 * - Skips words with no letters (numbers, symbols only)
 * - Uses consistent single-space separation
 */
export function toFirstLetterFormat(text: string): string {
  return text
    .split(/\s+/)
    .filter((word) => word.length > 0)
    .map((word) => {
      // Find the first letter character, ignoring leading punctuation
      const match = word.match(/[a-zA-Z]/)
      if (match) {
        // Preserve original capitalization for better visual hierarchy
        return match[0]
      }
      // If no letter found (e.g., numbers or symbols only), skip
      return ""
    })
    .filter((letter) => letter.length > 0)
    .join(" ")
}

export interface ParsedWord {
  word: string
  firstLetter: string
}

/**
 * Parses text into an array of words with their first letters.
 * Only includes words that contain at least one letter.
 */
export function parseWords(text: string): ParsedWord[] {
  return text
    .split(/\s+/)
    .filter((word) => word.length > 0)
    .map((word) => {
      const match = word.match(/[a-zA-Z]/)
      if (match) {
        return {
          word,
          firstLetter: match[0].toLowerCase(),
        }
      }
      return null
    })
    .filter((item): item is ParsedWord => item !== null)
}

export type WordComparisonStatus = "correct" | "incorrect" | "missing" | "extra"

export interface ComparedWord {
  word: string
  displayWord: string // The word to display (original for correct/missing, typed for incorrect/extra)
  status: WordComparisonStatus
  expected?: string // For incorrect words, what was expected
}

export interface Mistake {
  typed: string
  expected: string
  wordIndex: number
}

export interface ComparisonResult {
  words: ComparedWord[]
  correctCount: number
  incorrectCount: number
  missingCount: number
  extraCount: number
  totalExpected: number
  accuracy: number
  mistakes: Mistake[]
}

/**
 * Normalizes input text for splitting into words.
 * - Converts line breaks to spaces
 * - Collapses multiple spaces into single spaces
 * - Trims leading/trailing whitespace
 */
function normalizeText(text: string): string {
  return text
    .replace(/\r\n/g, " ")    // Windows line breaks
    .replace(/\n/g, " ")      // Unix line breaks
    .replace(/\t/g, " ")      // Tabs
    .replace(/\s+/g, " ")     // Collapse multiple spaces
    .trim()
}

/**
 * Normalizes a single word for comparison.
 * - Converts to lowercase
 * - Removes all punctuation and special characters
 * - Keeps only letters and numbers
 */
function normalizeWord(word: string): string {
  return word
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
}

/**
 * Splits normalized text into an array of words.
 * Filters out empty strings that might result from splitting.
 */
function splitIntoWords(text: string): string[] {
  return normalizeText(text)
    .split(" ")
    .filter((word) => word.length > 0)
}

/**
 * Compares typed text against original text word by word.
 * 
 * Normalization:
 * - Ignores capitalization differences ("Hello" matches "hello")
 * - Trims extra whitespace (leading, trailing, repeated)
 * - Handles line breaks as word separators
 * - Ignores punctuation for comparison ("don't" matches "dont")
 * 
 * Comparison:
 * - correct: typed word matches expected word
 * - incorrect: typed word exists but doesn't match expected
 * - missing: expected word was not typed (user stopped early)
 * - extra: typed word has no corresponding expected word (user typed too much)
 * 
 * Accuracy is calculated as: (correct / totalExpected) * 100
 */
export function compareTexts(typed: string, original: string): ComparisonResult {
  const typedWords = splitIntoWords(typed)
  const originalWords = splitIntoWords(original)
  
  const words: ComparedWord[] = []
  const mistakes: Mistake[] = []
  
  let correctCount = 0
  let incorrectCount = 0
  let missingCount = 0
  let extraCount = 0
  
  const maxLength = Math.max(typedWords.length, originalWords.length)
  
  for (let i = 0; i < maxLength; i++) {
    const typedWord = typedWords[i]
    const originalWord = originalWords[i]
    
    // Case 1: Both words exist at this position
    if (typedWord !== undefined && originalWord !== undefined) {
      const typedNormalized = normalizeWord(typedWord)
      const originalNormalized = normalizeWord(originalWord)
      
      if (typedNormalized === originalNormalized) {
        // Words match (ignoring case and punctuation)
        words.push({
          word: originalWord,
          displayWord: originalWord,
          status: "correct",
        })
        correctCount++
      } else {
        // Words don't match
        words.push({
          word: typedWord,
          displayWord: typedWord,
          status: "incorrect",
          expected: originalWord,
        })
        incorrectCount++
        mistakes.push({
          typed: typedWord,
          expected: originalWord,
          wordIndex: i,
        })
      }
    }
    // Case 2: Original word exists but user didn't type it (missing)
    else if (originalWord !== undefined && typedWord === undefined) {
      words.push({
        word: originalWord,
        displayWord: originalWord,
        status: "missing",
      })
      missingCount++
      mistakes.push({
        typed: "(missing)",
        expected: originalWord,
        wordIndex: i,
      })
    }
    // Case 3: User typed extra words beyond the original
    else if (typedWord !== undefined && originalWord === undefined) {
      words.push({
        word: typedWord,
        displayWord: typedWord,
        status: "extra",
      })
      extraCount++
      mistakes.push({
        typed: typedWord,
        expected: "(none)",
        wordIndex: i,
      })
    }
  }
  
  const totalExpected = originalWords.length
  const accuracy = totalExpected > 0 
    ? Math.round((correctCount / totalExpected) * 100) 
    : 0
  
  return {
    words,
    correctCount,
    incorrectCount,
    missingCount,
    extraCount,
    totalExpected,
    accuracy,
    mistakes,
  }
}
