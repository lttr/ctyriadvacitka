import { eq } from "drizzle-orm"
import { z } from "zod"

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
})

export default defineEventHandler(async (event) => {
  checkLoginRateLimit(event)

  const body = await readBody(event)

  const parsed = loginSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, message: "Neplatná data" })
  }

  const { username, password } = parsed.data

  const user = await db
    .select()
    .from(tables.users)
    .where(eq(tables.users.username, username))
    .get()

  if (!user || !verifyPassword(password, user.password)) {
    throw createError({
      statusCode: 401,
      message: "Nesprávné uživatelské jméno nebo heslo",
    })
  }

  await createSession(event, user.id)

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
