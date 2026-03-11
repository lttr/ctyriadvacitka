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
    .select()
    .from(tables.articles)
    .where(eq(tables.articles.url, url))
    .get()

  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: "Article not found" })
  }

  if (user.role !== "admin" && existing.author !== user.username) {
    throw createError({ statusCode: 403, statusMessage: "Nedostatečná oprávnění" })
  }

  const [updated] = await db
    .update(tables.articles)
    .set({ requestable: !existing.requestable })
    .where(eq(tables.articles.id, existing.id))
    .returning()

  return updated
})
