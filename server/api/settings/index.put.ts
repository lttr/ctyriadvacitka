import { eq } from "drizzle-orm"

export default defineEventHandler(async (event) => {
  await requireRole(event, "admin")

  const body = await readBody(event)

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw createError({
      statusCode: 400,
      message: "Neplatná data nastavení",
    })
  }

  const entries = Object.entries(body).filter(
    ([, value]) => typeof value === "string",
  )

  if (entries.length === 0) {
    throw createError({
      statusCode: 400,
      message: "Žádná nastavení k aktualizaci",
    })
  }

  for (const [key, value] of entries) {
    const existing = await db
      .select()
      .from(tables.siteSettings)
      .where(eq(tables.siteSettings.key, key))
      .get()

    if (existing) {
      await db
        .update(tables.siteSettings)
        .set({ value: value as string })
        .where(eq(tables.siteSettings.key, key))
    } else {
      await db
        .insert(tables.siteSettings)
        .values({ key, value: value as string })
    }
  }

  return { success: true }
})
