import { eq } from "drizzle-orm"

export default defineEventHandler(async () => {
  return db
    .select({
      id: tables.articles.id,
      title: tables.articles.title,
      url: tables.articles.url,
    })
    .from(tables.articles)
    .where(eq(tables.articles.inMenu, true))
    .orderBy(tables.articles.title)
})
