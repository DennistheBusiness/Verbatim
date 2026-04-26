import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"
import { NextResponse } from "next/server"

// Lazily-created Redis instance. Returns null when Upstash env vars are absent
// so rate limiting fails-open in local dev without requiring credentials.
function createRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  return new Redis({ url, token })
}

function createLimiter(requests: number, window: `${number} ${"ms" | "s" | "m" | "h" | "d"}`) {
  const redis = createRedis()
  if (!redis) return null
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(requests, window),
    analytics: false,
  })
}

// 20 transcriptions per user per hour — limits Groq spend per user
export const transcribeLimiter = createLimiter(20, "1 h")

// 30 OCR extractions per user per hour — limits Groq vision spend per user
export const ocrLimiter = createLimiter(30, "1 h")

// 200 requests per user per minute for admin panel actions
export const adminLimiter = createLimiter(200, "1 m")

/**
 * Check a rate limit for a given identifier.
 * Returns null when Upstash is not configured (fail-open).
 * Returns a 429 NextResponse when the limit is exceeded.
 */
export async function applyRateLimit(
  limiter: ReturnType<typeof createLimiter>,
  identifier: string,
): Promise<NextResponse | null> {
  if (!limiter) return null // Not configured — allow through

  const { success, remaining, reset } = await limiter.limit(identifier)

  if (!success) {
    const retryAfter = Math.max(0, Math.ceil((reset - Date.now()) / 1000))
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: {
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(reset),
          "Retry-After": String(retryAfter),
        },
      },
    )
  }

  return null // Allowed
}
