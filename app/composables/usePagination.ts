export interface PaginationInput {
  page: number
  perPage: number
  totalCount: number
}

export interface PaginationResult {
  page: number
  perPage: number
  totalCount: number
  totalPages: number
  hasPrev: boolean
  hasNext: boolean
  pages: number[]
}

export function calculatePagination(input: PaginationInput): PaginationResult {
  const totalPages = Math.max(1, Math.ceil(input.totalCount / input.perPage))
  const page = Math.max(1, Math.min(input.page, totalPages))

  return {
    page,
    perPage: input.perPage,
    totalCount: input.totalCount,
    totalPages,
    hasPrev: page > 1,
    hasNext: page < totalPages,
    pages: Array.from({ length: totalPages }, (_, i) => i + 1),
  }
}
