export default defineEventHandler(async () => {
  const settings = await db.select().from(tables.siteSettings)

  return Object.fromEntries(
    settings.map((s: { key: string; value: string | null }) => [
      s.key,
      s.value,
    ]),
  )
})
