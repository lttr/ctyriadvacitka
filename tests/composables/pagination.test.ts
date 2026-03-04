import { describe, expect, it } from "vitest"

import { calculatePagination } from "~~/app/composables/usePagination"

describe("calculatePagination", () => {
  it("calculates total pages correctly", () => {
    expect(
      calculatePagination({ page: 1, perPage: 10, totalCount: 25 }),
    ).toMatchObject({
      totalPages: 3,
    })
  })

  it("returns 1 total page when totalCount is 0", () => {
    expect(
      calculatePagination({ page: 1, perPage: 10, totalCount: 0 }),
    ).toMatchObject({
      totalPages: 1,
    })
  })

  it("calculates hasPrev and hasNext", () => {
    const first = calculatePagination({ page: 1, perPage: 10, totalCount: 25 })
    expect(first.hasPrev).toBe(false)
    expect(first.hasNext).toBe(true)

    const middle = calculatePagination({ page: 2, perPage: 10, totalCount: 25 })
    expect(middle.hasPrev).toBe(true)
    expect(middle.hasNext).toBe(true)

    const last = calculatePagination({ page: 3, perPage: 10, totalCount: 25 })
    expect(last.hasPrev).toBe(true)
    expect(last.hasNext).toBe(false)
  })

  it("clamps page to valid range", () => {
    const result = calculatePagination({ page: 5, perPage: 10, totalCount: 25 })
    expect(result.page).toBe(3)

    const result2 = calculatePagination({
      page: 0,
      perPage: 10,
      totalCount: 25,
    })
    expect(result2.page).toBe(1)
  })

  it("generates correct page numbers for display", () => {
    const result = calculatePagination({ page: 1, perPage: 10, totalCount: 55 })
    expect(result.pages).toEqual([1, 2, 3, 4, 5, 6])
  })

  it("handles exact division", () => {
    const result = calculatePagination({ page: 1, perPage: 10, totalCount: 30 })
    expect(result.totalPages).toBe(3)
  })
})
