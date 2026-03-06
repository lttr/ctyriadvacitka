import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { createRateLimiter } from "~~/server/utils/rateLimit"

describe("rate limiter", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("allows requests within the limit", () => {
    const limiter = createRateLimiter({ maxAttempts: 5, windowMs: 60_000 })
    for (let i = 0; i < 5; i++) {
      expect(limiter.check("192.168.1.1")).toEqual({ allowed: true })
    }
  })

  it("blocks requests exceeding the limit", () => {
    const limiter = createRateLimiter({ maxAttempts: 3, windowMs: 60_000 })
    for (let i = 0; i < 3; i++) {
      limiter.check("192.168.1.1")
    }
    const result = limiter.check("192.168.1.1")
    expect(result.allowed).toBe(false)
    expect(result.retryAfterMs).toBeGreaterThan(0)
  })

  it("tracks different keys independently", () => {
    const limiter = createRateLimiter({ maxAttempts: 2, windowMs: 60_000 })
    limiter.check("ip-a")
    limiter.check("ip-a")
    expect(limiter.check("ip-a").allowed).toBe(false)
    expect(limiter.check("ip-b").allowed).toBe(true)
  })

  it("resets after the time window passes", () => {
    const limiter = createRateLimiter({ maxAttempts: 2, windowMs: 60_000 })
    limiter.check("ip-a")
    limiter.check("ip-a")
    expect(limiter.check("ip-a").allowed).toBe(false)

    vi.advanceTimersByTime(60_001)

    expect(limiter.check("ip-a").allowed).toBe(true)
  })

  it("returns retryAfterMs when blocked", () => {
    const limiter = createRateLimiter({ maxAttempts: 1, windowMs: 30_000 })
    limiter.check("ip-a")
    const result = limiter.check("ip-a")
    expect(result.allowed).toBe(false)
    expect(result.retryAfterMs).toBeLessThanOrEqual(30_000)
    expect(result.retryAfterMs).toBeGreaterThan(0)
  })

  it("cleans up expired entries", () => {
    const limiter = createRateLimiter({ maxAttempts: 1, windowMs: 1_000 })
    limiter.check("old-ip")
    vi.advanceTimersByTime(2_000)
    limiter.cleanup()
    // After cleanup, old-ip should be gone — new request should be allowed
    expect(limiter.check("old-ip").allowed).toBe(true)
  })

  it("counts only attempts within the current window", () => {
    const limiter = createRateLimiter({ maxAttempts: 2, windowMs: 10_000 })
    limiter.check("ip-a") // t=0
    vi.advanceTimersByTime(6_000)
    limiter.check("ip-a") // t=6000
    vi.advanceTimersByTime(5_000) // t=11000, first attempt expired
    // Only one attempt in window now, should be allowed
    expect(limiter.check("ip-a").allowed).toBe(true)
  })
})
