import { desc } from "drizzle-orm"

export default defineEventHandler(async () => {
  return db
    .select()
    .from(tables.news)
    .orderBy(desc(tables.news.datetime))
    .limit(5)
})
