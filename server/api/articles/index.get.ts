import { desc } from "drizzle-orm"

export default defineEventHandler(async () => {
  return db
    .select()
    .from(tables.articles)
    .orderBy(desc(tables.articles.datetime))
})
