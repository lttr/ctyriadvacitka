import { eq } from "drizzle-orm"

export default defineEventHandler(async (event) => {
  await requireRole(event, "editor")

  const url = getRouterParam(event, "url")
  if (!url) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing url parameter",
    })
  }

  const existing = await db
    .select({ id: tables.articles.id })
    .from(tables.articles)
    .where(eq(tables.articles.url, url))
    .get()

  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: "Article not found" })
  }

  await db.delete(tables.articles).where(eq(tables.articles.id, existing.id))

  return { success: true }
})
