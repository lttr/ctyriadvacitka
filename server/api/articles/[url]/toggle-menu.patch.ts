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
    .select()
    .from(tables.articles)
    .where(eq(tables.articles.url, url))
    .get()

  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: "Article not found" })
  }

  const [updated] = await db
    .update(tables.articles)
    .set({ inMenu: !existing.inMenu })
    .where(eq(tables.articles.id, existing.id))
    .returning()

  return updated
})
