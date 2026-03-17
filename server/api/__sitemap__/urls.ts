import { eq } from "drizzle-orm"

export default defineEventHandler(async () => {
  const articleRows: { url: string; datetime: string | null }[] = await db
    .select({ url: tables.articles.url, datetime: tables.articles.datetime })
    .from(tables.articles)
    .where(eq(tables.articles.requestable, true))

  return articleRows.map((article) => ({
    loc: `/clanek/${article.url}`,
    lastmod: article.datetime ?? undefined,
  }))
})
