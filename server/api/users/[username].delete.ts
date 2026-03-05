import { eq } from "drizzle-orm"

export default defineEventHandler(async (event) => {
  const currentUser = await requireRole(event, "admin")

  const username = getRouterParam(event, "username")
  if (!username) {
    throw createError({ statusCode: 400, message: "Chybí uživatelské jméno" })
  }

  if (username === currentUser.username) {
    throw createError({
      statusCode: 400,
      message: "Nemůžete smazat vlastní účet",
    })
  }

  const existing = await db
    .select({ id: tables.users.id })
    .from(tables.users)
    .where(eq(tables.users.username, username))
    .get()

  if (!existing) {
    throw createError({ statusCode: 404, message: "Uživatel nenalezen" })
  }

  await db.delete(tables.users).where(eq(tables.users.username, username))

  return { success: true }
})
