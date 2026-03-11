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

  const body = await readBody(event)

  // If url is being changed, check for duplicates
  if (body.url && body.url !== url) {
    const duplicate = await db
      .select({ id: tables.articles.id })
      .from(tables.articles)
      .where(eq(tables.articles.url, body.url))
      .get()

    if (duplicate) {
      throw createError({
        statusCode: 409,
        statusMessage: "Article with this URL already exists",
      })
    }
  }

  const updateData: Record<string, unknown> = {}
  if (body.title !== undefined) {
    updateData.title = body.title
  }
  if (body.url !== undefined) {
    updateData.url = body.url
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
  if (body.inMenu !== undefined) {
    updateData.inMenu = body.inMenu
  }
  if (body.requestable !== undefined) {
    updateData.requestable = body.requestable
  }

  const [updated] = await db
    .update(tables.articles)
    .set(updateData)
    .where(eq(tables.articles.id, existing.id))
    .returning()

  return updated
})
