export default defineEventHandler(async (event) => {
  await requireRole(event, "editor")

  const body = await readBody(event)

  if (!body?.title || typeof body.title !== "string") {
    throw createError({ statusCode: 400, statusMessage: "Title is required" })
  }

  const [newsItem] = await db
    .insert(tables.news)
    .values({
      title: body.title,
      content: body.content ?? null,
      author: body.author ?? null,
      datetime: body.datetime ?? null,
    })
    .returning()

  setResponseStatus(event, 201)
  return newsItem
})
