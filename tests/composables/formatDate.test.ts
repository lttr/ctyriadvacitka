import { describe, expect, it, vi, beforeEach, afterEach } from "vitest"

import {
  formatCzechDate,
  formatCzechDateTime,
  formatRelativeDate,
} from "~~/shared/utils/date"

describe("formatCzechDate", () => {
  it("formats ISO date string to Czech locale format", () => {
    const result = formatCzechDate("2026-01-15T10:00:00.000Z")

    // Czech format: d. m. yyyy
    expect(result).toBe("15. 1. 2026")
  })

  it("formats another date correctly", () => {
    const result = formatCzechDate("2026-03-04T12:00:00.000Z")

    expect(result).toBe("4. 3. 2026")
  })

  it("handles date without time component", () => {
    const result = formatCzechDate("2026-06-05")

    expect(result).toMatch(/^\d{1,2}\.\s\d{1,2}\.\s\d{4}$/)
  })

  it("returns empty string for empty input", () => {
    expect(formatCzechDate("")).toBe("")
  })

  it("returns empty string for undefined input", () => {
    expect(formatCzechDate(undefined)).toBe("")
  })

  it("returns empty string for null input", () => {
    expect(formatCzechDate(null)).toBe("")
  })
})

describe("formatCzechDateTime", () => {
  it("formats ISO date string to Czech date and time format", () => {
    const result = formatCzechDateTime("2026-01-15T10:30:00.000Z")

    // Should contain both date and time
    expect(result).toMatch(/15\.\s1\.\s2026/)
    expect(result).toMatch(/\d{1,2}:\d{2}/)
  })

  it("includes hours and minutes", () => {
    const result = formatCzechDateTime("2026-03-04T14:45:00.000Z")

    expect(result).toMatch(/\d{1,2}\.\s\d{1,2}\.\s\d{4}\s\d{1,2}:\d{2}/)
  })

  it("returns empty string for empty input", () => {
    expect(formatCzechDateTime("")).toBe("")
  })

  it("returns empty string for undefined input", () => {
    expect(formatCzechDateTime(undefined)).toBe("")
  })

  it("returns empty string for null input", () => {
    expect(formatCzechDateTime(null)).toBe("")
  })
})

describe("formatRelativeDate", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-03-08T12:00:00.000Z"))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("returns 'právě teď' for just now", () => {
    const result = formatRelativeDate("2026-03-08T12:00:00.000Z")

    expect(result).toBe("právě teď")
  })

  it("returns minutes ago for recent timestamps", () => {
    const result = formatRelativeDate("2026-03-08T11:45:00.000Z")

    expect(result).toBe("před 15 min")
  })

  it("returns hours ago for timestamps within a day", () => {
    const result = formatRelativeDate("2026-03-08T09:00:00.000Z")

    expect(result).toBe("před 3 hod")
  })

  it("returns days ago for timestamps within a week", () => {
    const result = formatRelativeDate("2026-03-06T12:00:00.000Z")

    expect(result).toBe("před 2 dny")
  })

  it("falls back to Czech date format for older timestamps", () => {
    const result = formatRelativeDate("2026-02-20T12:00:00.000Z")

    expect(result).toBe("20. 2. 2026")
  })

  it("returns empty string for empty input", () => {
    expect(formatRelativeDate("")).toBe("")
  })

  it("returns empty string for undefined input", () => {
    expect(formatRelativeDate(undefined)).toBe("")
  })

  it("returns empty string for null input", () => {
    expect(formatRelativeDate(null)).toBe("")
  })
})
