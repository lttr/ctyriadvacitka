import { eq } from "drizzle-orm"

export default defineEventHandler(async (event) => {
  await requireRole(event, "editor")

  const idParam = getRouterParam(event, "id")
  const id = Number(idParam)

  if (!idParam || Number.isNaN(id)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid id parameter",
    })
  }

  const existing = await db
    .select({ id: tables.news.id })
    .from(tables.news)
    .where(eq(tables.news.id, id))
    .get()

  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: "News item not found" })
  }

  await db.delete(tables.news).where(eq(tables.news.id, id))

  return { success: true }
})
