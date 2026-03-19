import { eq } from "drizzle-orm"

export default defineEventHandler(async (event) => {
  const key = getRouterParam(event, "key")
  if (!key) {
    throw createError({
      statusCode: 400,
      message: "Missing key parameter",
    })
  }

  const [setting] = await db
    .select()
    .from(tables.siteSettings)
    .where(eq(tables.siteSettings.key, key))

  if (!setting) {
    throw createError({ statusCode: 404, message: "Setting not found" })
  }

  return setting
})
