import { count, desc } from "drizzle-orm"

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const page = Math.max(1, Number(query.page) || 1)
  const perPage = Math.min(50, Math.max(1, Number(query.perPage) || 10))
  const offset = (page - 1) * perPage

  const [items, [{ totalCount }]] = await Promise.all([
    db
      .select()
      .from(tables.articles)
      .orderBy(desc(tables.articles.datetime))
      .limit(perPage)
      .offset(offset),
    db.select({ totalCount: count() }).from(tables.articles),
  ])

  return { items, page, perPage, totalCount }
})
