import type { H3Event } from "h3"

interface RateLimiterOptions {
  maxAttempts: number
  windowMs: number
}

interface RateLimitResult {
  allowed: boolean
  retryAfterMs?: number
}

export function createRateLimiter(options: RateLimiterOptions) {
  const attempts = new Map<string, number[]>()

  function check(key: string): RateLimitResult {
    const now = Date.now()
    const windowStart = now - options.windowMs

    const existing = attempts.get(key) ?? []
    const recent = existing.filter((t) => t > windowStart)

    if (recent.length >= options.maxAttempts) {
      const oldestInWindow = recent[0] ?? now
      const retryAfterMs = oldestInWindow + options.windowMs - now
      return { allowed: false, retryAfterMs }
    }

    recent.push(now)
    attempts.set(key, recent)
    return { allowed: true }
  }

  function cleanup() {
    const now = Date.now()
    const windowStart = now - options.windowMs
    for (const [key, timestamps] of attempts) {
      const recent = timestamps.filter((t) => t > windowStart)
      if (recent.length === 0) {
        attempts.delete(key)
      } else {
        attempts.set(key, recent)
      }
    }
  }

  return { check, cleanup }
}

// Pre-configured limiters for specific endpoints
const loginLimiter = createRateLimiter({ maxAttempts: 5, windowMs: 60_000 })
const registerLimiter = createRateLimiter({ maxAttempts: 3, windowMs: 60_000 })
const contactLimiter = createRateLimiter({ maxAttempts: 5, windowMs: 300_000 })

function getClientIp(event: H3Event): string {
  const forwarded = getRequestHeader(event, "x-forwarded-for")
  if (forwarded) {
    const first = forwarded.split(",")[0]
    return first ? first.trim() : "unknown"
  }
  return getRequestHeader(event, "x-real-ip") ?? "unknown"
}

export function checkLoginRateLimit(event: H3Event) {
  const ip = getClientIp(event)
  const result = loginLimiter.check(ip)
  if (!result.allowed) {
    throw createError({
      statusCode: 429,
      message: "Příliš mnoho pokusů o přihlášení. Zkuste to později.",
      data: { retryAfterMs: result.retryAfterMs },
    })
  }
}

export function checkRegisterRateLimit(event: H3Event) {
  const ip = getClientIp(event)
  const result = registerLimiter.check(ip)
  if (!result.allowed) {
    throw createError({
      statusCode: 429,
      message: "Příliš mnoho pokusů o registraci. Zkuste to později.",
      data: { retryAfterMs: result.retryAfterMs },
    })
  }
}

export function checkContactRateLimit(event: H3Event) {
  const ip = getClientIp(event)
  const result = contactLimiter.check(ip)
  if (!result.allowed) {
    throw createError({
      statusCode: 429,
      message: "Příliš mnoho odeslaných zpráv. Zkuste to později.",
      data: { retryAfterMs: result.retryAfterMs },
    })
  }
}
