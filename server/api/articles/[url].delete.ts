import { eq } from "drizzle-orm"

export default defineEventHandler(async (event) => {
  const user = await requireRole(event, "editor")

  const url = getRouterParam(event, "url")
  if (!url) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing url parameter",
    })
  }

  const existing = await db
    .select({ id: tables.articles.id, author: tables.articles.author })
    .from(tables.articles)
    .where(eq(tables.articles.url, url))
    .get()

  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: "Article not found" })
  }

  if (user.role !== "admin" && existing.author !== user.username) {
    throw createError({ statusCode: 403, statusMessage: "Nedostatečná oprávnění" })
  }

  await db.delete(tables.articles).where(eq(tables.articles.id, existing.id))

  return { success: true }
})
