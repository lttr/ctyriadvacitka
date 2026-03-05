import { eq, or } from "drizzle-orm"
import { z } from "zod"

const registerSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(6).max(100),
  name: z.string().min(1).max(100).optional(),
  surname: z.string().min(1).max(100).optional(),
  nickname: z.string().min(1).max(100).optional(),
  email: z.email().optional(),
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const parsed = registerSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, message: "Neplatná data" })
  }

  const { username, password, name, surname, nickname, email } = parsed.data

  // Check for existing user with same username or email
  const conditions = [eq(tables.users.username, username)]
  if (email) {
    conditions.push(eq(tables.users.email, email))
  }

  const existing = await db
    .select({ id: tables.users.id })
    .from(tables.users)
    .where(or(...conditions))
    .get()

  if (existing) {
    throw createError({
      statusCode: 409,
      message: "Uživatel s tímto jménem nebo e-mailem již existuje",
    })
  }

  const hashedPassword = hashPassword(password)

  const inserted = await db
    .insert(tables.users)
    .values({
      username,
      password: hashedPassword,
      name: name ?? null,
      surname: surname ?? null,
      nickname: nickname ?? null,
      email: email ?? null,
      role: "registered",
    })
    .returning()

  const user = inserted[0]

  return {
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      surname: user.surname,
      nickname: user.nickname,
      email: user.email,
      role: user.role,
    },
  }
})
