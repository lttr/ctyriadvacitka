import { eq } from "drizzle-orm"
import { z } from "zod"

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(6).max(100),
    newPasswordAgain: z.string().min(1),
  })
  .refine((data) => data.newPassword === data.newPasswordAgain, {
    message: "Hesla se neschodují!",
    path: ["newPasswordAgain"],
  })

export default defineEventHandler(async (event) => {
  const currentUser = await requireAuth(event)
  const body = await readBody(event)

  const parsed = changePasswordSchema.safeParse(body)
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]
    if (firstError?.message === "Hesla se neschodují!") {
      throw createError({ statusCode: 400, message: "Hesla se neschodují!" })
    }
    throw createError({ statusCode: 400, message: "Neplatná data" })
  }

  const { currentPassword, newPassword } = parsed.data

  // Fetch current password hash
  const user = await db
    .select({ password: tables.users.password })
    .from(tables.users)
    .where(eq(tables.users.id, currentUser.id))
    .get()

  if (!user || !verifyPassword(currentPassword, user.password)) {
    throw createError({
      statusCode: 400,
      message: "Současné heslo neodpovídá zadanému současnému heslu!",
    })
  }

  const newHash = hashPassword(newPassword)
  await db
    .update(tables.users)
    .set({ password: newHash })
    .where(eq(tables.users.id, currentUser.id))

  return { success: true }
})
