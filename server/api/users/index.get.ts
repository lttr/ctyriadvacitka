import { asc } from "drizzle-orm"

export default defineEventHandler(async (event) => {
  await requireRole(event, "admin")

  const users = await db
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
    .orderBy(asc(tables.users.username))

  return users
})
