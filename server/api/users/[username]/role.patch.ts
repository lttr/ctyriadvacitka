import { eq } from "drizzle-orm"
import { z } from "zod"

const roleSchema = z.object({
  role: z.enum(["registered", "editor", "admin"]),
})

export default defineEventHandler(async (event) => {
  const currentUser = await requireRole(event, "admin")

  const username = getRouterParam(event, "username")
  if (!username) {
    throw createError({ statusCode: 400, message: "Chybí uživatelské jméno" })
  }

  if (username === currentUser.username) {
    throw createError({
      statusCode: 400,
      message: "Nemůžete změnit vlastní roli",
    })
  }

  const body = await readBody(event)
  const parsed = roleSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, message: "Neplatná role" })
  }

  const existing = await db
    .select({
      id: tables.users.id,
      username: tables.users.username,
      name: tables.users.name,
      surname: tables.users.surname,
      nickname: tables.users.nickname,
      email: tables.users.email,
      role: tables.users.role,
    })
    .from(tables.users)
    .where(eq(tables.users.username, username))
    .get()

  if (!existing) {
    throw createError({ statusCode: 404, message: "Uživatel nenalezen" })
  }

  await db
    .update(tables.users)
    .set({ role: parsed.data.role })
    .where(eq(tables.users.username, username))

  return {
    user: {
      ...existing,
      role: parsed.data.role,
    },
  }
})
