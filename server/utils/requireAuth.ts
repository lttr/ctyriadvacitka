import type { H3Event } from "h3"
import { createError } from "h3"

export async function requireAuth(event: H3Event) {
  const user = await getSessionUser(event)
  if (!user) {
    throw createError({ statusCode: 401, message: "Nepřihlášen" })
  }
  return user
}
