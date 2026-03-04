import { desc } from "drizzle-orm"

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const page = Math.max(1, Number(query.page) || 1)
  const perPage = Math.min(50, Math.max(1, Number(query.perPage) || 10))
  const offset = (page - 1) * perPage

  const items = await db
    .select()
    .from(tables.news)
    .orderBy(desc(tables.news.datetime))
    .limit(perPage)
    .offset(offset)

  return { items, page, perPage }
})
