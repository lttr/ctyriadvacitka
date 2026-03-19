import { eq } from "drizzle-orm"

export default defineEventHandler(async (event) => {
  const url = getRouterParam(event, "url")
  if (!url) {
    throw createError({
      statusCode: 400,
      message: "Missing url parameter",
    })
  }

  const [article] = await db
    .select()
    .from(tables.articles)
    .where(eq(tables.articles.url, url))

  if (!article) {
    throw createError({ statusCode: 404, message: "Article not found" })
  }

  // Non-requestable articles are only visible to editors and admins
  if (!article.requestable) {
    const user = await getSessionUser(event)
    const isEditor = user?.role === "editor" || user?.role === "admin"
    if (!isEditor) {
      throw createError({
        statusCode: 404,
        message: "Article not found",
      })
    }
  }

  return article
})
