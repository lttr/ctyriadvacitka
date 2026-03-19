import { eq } from "drizzle-orm"

export default defineEventHandler(async (event) => {
  await requireRole(event, "editor")

  const body = await readBody(event)

  if (!body?.title || typeof body.title !== "string") {
    throw createError({ statusCode: 400, message: "Title is required" })
  }

  if (!body?.url || typeof body.url !== "string") {
    throw createError({ statusCode: 400, message: "URL is required" })
  }

  // Check for duplicate url
  const existing = await db
    .select({ id: tables.articles.id })
    .from(tables.articles)
    .where(eq(tables.articles.url, body.url))
    .get()

  if (existing) {
    throw createError({
      statusCode: 409,
      message: "Article with this URL already exists",
    })
  }

  const [article] = await db
    .insert(tables.articles)
    .values({
      title: body.title,
      url: body.url,
      content: body.content ?? null,
      author: body.author ?? null,
      datetime: body.datetime ?? null,
      inMenu: body.inMenu ?? false,
      requestable: body.requestable ?? false,
    })
    .returning()

  setResponseStatus(event, 201)
  return article
})
