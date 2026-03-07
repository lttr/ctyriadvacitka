import { and, count, desc, eq, or, sql } from "drizzle-orm"

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const page = Math.max(1, Number(query.page) || 1)
  const perPage = Math.min(50, Math.max(1, Number(query.perPage) || 10))
  const offset = (page - 1) * perPage
  const search = typeof query.search === "string" ? query.search.trim() : ""

  const user = await getSessionUser(event)
  const isEditor = user?.role === "editor" || user?.role === "admin"

  const searchClause = search
    ? or(
        sql`lower(${tables.articles.title}) like ${`%${search.toLowerCase()}%`}`,
        sql`lower(${tables.articles.content}) like ${`%${search.toLowerCase()}%`}`,
      )
    : undefined

  const requestableClause = isEditor
    ? undefined
    : eq(tables.articles.requestable, true)

  const whereClause =
    searchClause && requestableClause
      ? and(searchClause, requestableClause)
      : (searchClause ?? requestableClause)

  const [items, [{ totalCount }]] = await Promise.all([
    db
      .select()
      .from(tables.articles)
      .where(whereClause)
      .orderBy(desc(tables.articles.datetime))
      .limit(perPage)
      .offset(offset),
    db.select({ totalCount: count() }).from(tables.articles).where(whereClause),
  ])

  return { items, page, perPage, totalCount }
})
