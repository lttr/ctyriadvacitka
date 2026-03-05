import { count } from "drizzle-orm"

export default defineEventHandler(async (event) => {
  await requireRole(event, "editor")

  const [[{ articleCount }], [{ newsCount }], [{ userCount }]] =
    await Promise.all([
      db.select({ articleCount: count() }).from(tables.articles),
      db.select({ newsCount: count() }).from(tables.news),
      db.select({ userCount: count() }).from(tables.users),
    ])

  return { articleCount, newsCount, userCount }
})
