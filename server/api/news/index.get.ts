import { count, desc, or, sql } from "drizzle-orm"

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const page = Math.max(1, Number(query.page) || 1)
  const perPage = Math.min(50, Math.max(1, Number(query.perPage) || 10))
  const offset = (page - 1) * perPage
  const search = typeof query.search === "string" ? query.search.trim() : ""

  const whereClause = search
    ? or(
        sql`lower(${tables.news.title}) like ${`%${search.toLowerCase()}%`}`,
        sql`lower(${tables.news.content}) like ${`%${search.toLowerCase()}%`}`,
      )
    : undefined

  const [items, [{ totalCount }]] = await Promise.all([
    db
      .select()
      .from(tables.news)
      .where(whereClause)
      .orderBy(desc(tables.news.datetime))
      .limit(perPage)
      .offset(offset),
    db.select({ totalCount: count() }).from(tables.news).where(whereClause),
  ])

  return { items, page, perPage, totalCount }
})
