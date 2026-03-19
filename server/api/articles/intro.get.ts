import { eq } from "drizzle-orm"

export default defineEventHandler(async () => {
  const [setting] = await db
    .select()
    .from(tables.siteSettings)
    .where(eq(tables.siteSettings.key, "introArticleId"))

  if (!setting?.value) {
    throw createError({
      statusCode: 404,
      message: "Intro article not configured",
    })
  }

  const [article] = await db
    .select()
    .from(tables.articles)
    .where(eq(tables.articles.id, Number(setting.value)))

  if (!article) {
    throw createError({
      statusCode: 404,
      message: "Intro article not found",
    })
  }

  return article
})
