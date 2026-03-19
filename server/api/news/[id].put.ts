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
    .select()
    .from(tables.news)
    .where(eq(tables.news.id, id))
    .get()

  if (!existing) {
    throw createError({ statusCode: 404, message: "News item not found" })
  }

  if (user.role !== "admin" && existing.author !== user.username) {
    throw createError({ statusCode: 403, message: "Nedostatečná oprávnění" })
  }

  const body = await readBody(event)

  const updateData: Record<string, unknown> = {}
  if (body.title !== undefined) {
    updateData.title = body.title
  }
  if (body.content !== undefined) {
    updateData.content = body.content
  }
  if (body.author !== undefined) {
    updateData.author = body.author
  }
  if (body.datetime !== undefined) {
    updateData.datetime = body.datetime
  }

  const [updated] = await db
    .update(tables.news)
    .set(updateData)
    .where(eq(tables.news.id, id))
    .returning()

  return updated
})
