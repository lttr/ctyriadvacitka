import type { H3Event } from "h3"
import { createError } from "h3"

const ROLE_HIERARCHY: Record<string, number> = {
  registered: 0,
  editor: 1,
  admin: 2,
}

export async function requireRole(
  event: H3Event,
  minimumRole: "editor" | "admin",
) {
  const user = await requireAuth(event)
  const userLevel = ROLE_HIERARCHY[user.role] ?? -1
  const requiredLevel = ROLE_HIERARCHY[minimumRole] ?? 0

  if (userLevel < requiredLevel) {
    throw createError({ statusCode: 403, message: "Nedostatečná oprávnění" })
  }

  return user
}
