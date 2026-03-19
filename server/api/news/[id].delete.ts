import { eq } from "drizzle-orm"

export default defineEventHandler(async (event) => {
  const user = await requireRole(event, "editor")

  const idParam = getRouterParam(event, "id")
  const id = Number(idParam)

  if (!idParam || Number.isNaN(id)) {
    throw createError({
      statusCode: 400,
      message: "Invalid id parameter",
    })
  }

  const existing = await db
    .select({ id: tables.news.id, author: tables.news.author })
    .from(tables.news)
    .where(eq(tables.news.id, id))
    .get()

  if (!existing) {
    throw createError({ statusCode: 404, message: "News item not found" })
  }

  if (user.role !== "admin" && existing.author !== user.username) {
    throw createError({ statusCode: 403, message: "Nedostatečná oprávnění" })
  }

  await db.delete(tables.news).where(eq(tables.news.id, id))

  return { success: true }
})
