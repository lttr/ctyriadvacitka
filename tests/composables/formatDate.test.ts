import { describe, expect, it } from "vitest"

import { formatCzechDate } from "~~/shared/utils/date"

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
})
