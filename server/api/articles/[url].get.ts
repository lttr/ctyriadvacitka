import { eq } from "drizzle-orm"

export default defineEventHandler(async (event) => {
  const url = getRouterParam(event, "url")
  if (!url) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing url parameter",
    })
  }

  const [article] = await db
    .select()
    .from(tables.articles)
    .where(eq(tables.articles.url, url))

  if (!article) {
    throw createError({ statusCode: 404, statusMessage: "Article not found" })
  }

  return article
})
