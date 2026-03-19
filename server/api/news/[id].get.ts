import { eq } from "drizzle-orm"

export default defineEventHandler(async (event) => {
  const idParam = getRouterParam(event, "id")
  const id = Number(idParam)

  if (!idParam || Number.isNaN(id)) {
    throw createError({
      statusCode: 400,
      message: "Invalid id parameter",
    })
  }

  const [newsItem] = await db
    .select()
    .from(tables.news)
    .where(eq(tables.news.id, id))

  if (!newsItem) {
    throw createError({ statusCode: 404, message: "News item not found" })
  }

  return newsItem
})
