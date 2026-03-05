import { eq, and, ne, or } from "drizzle-orm"
import { z } from "zod"

const updateProfileSchema = z.object({
  username: z.string().min(3).max(50),
  name: z.string().max(100).optional(),
  surname: z.string().max(100).optional(),
  nickname: z.string().max(100).optional(),
  email: z.email(),
})

export default defineEventHandler(async (event) => {
  const currentUser = await requireAuth(event)
  const body = await readBody(event)

  const parsed = updateProfileSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, message: "Neplatná data" })
  }

  const { username, name, surname, nickname, email } = parsed.data

  // Check for duplicate username or email (excluding current user)
  const conditions = []
  if (username !== currentUser.username) {
    conditions.push(eq(tables.users.username, username))
  }
  if (email !== currentUser.email) {
    conditions.push(eq(tables.users.email, email))
  }

  if (conditions.length > 0) {
    const existing = await db
      .select({ id: tables.users.id })
      .from(tables.users)
      .where(and(ne(tables.users.id, currentUser.id), or(...conditions)))
      .get()

    if (existing) {
      throw createError({
        statusCode: 409,
        message:
          "Uživatel s tímto přihlašovacím jménem nebo e-mailem již existuje",
      })
    }
  }

  await db
    .update(tables.users)
    .set({
      username,
      name: name ?? null,
      surname: surname ?? null,
      nickname: nickname ?? null,
      email,
    })
    .where(eq(tables.users.id, currentUser.id))

  const updated = await db
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
    .where(eq(tables.users.id, currentUser.id))
    .get()

  return { user: updated }
})
