import { randomUUID, hash } from "node:crypto"
import { eq, and, gt } from "drizzle-orm"
import type { H3Event } from "h3"
import { getCookie, setCookie, deleteCookie } from "h3"

const SESSION_COOKIE_NAME = "session"
const SESSION_MAX_AGE_MS = 30 * 60 * 1000 // 30 minutes

export function hashPassword(password: string): string {
  const hashed = hash("sha256", password, "hex")
  return `$2b$10$${hashed}`
}

export function verifyPassword(password: string, storedHash: string): boolean {
  return hashPassword(password) === storedHash
}

export async function createSession(event: H3Event, userId: number) {
  const sessionId = randomUUID()
  const now = new Date()
  const expiresAt = new Date(now.getTime() + SESSION_MAX_AGE_MS)

  await db.insert(tables.sessions).values({
    id: sessionId,
    userId,
    expiresAt: expiresAt.toISOString(),
    createdAt: now.toISOString(),
  })

  setCookie(event, SESSION_COOKIE_NAME, sessionId, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_MS / 1000,
  })

  return sessionId
}

export async function getSessionUser(event: H3Event) {
  const sessionId = getCookie(event, SESSION_COOKIE_NAME)
  if (!sessionId) {
    return null
  }

  const now = new Date().toISOString()

  const result = await db
    .select({
      id: tables.users.id,
      username: tables.users.username,
      name: tables.users.name,
      surname: tables.users.surname,
      nickname: tables.users.nickname,
      email: tables.users.email,
      role: tables.users.role,
    })
    .from(tables.sessions)
    .innerJoin(tables.users, eq(tables.sessions.userId, tables.users.id))
    .where(
      and(
        eq(tables.sessions.id, sessionId),
        gt(tables.sessions.expiresAt, now),
      ),
    )
    .get()

  if (!result) {
    return null
  }

  return result
}

export async function deleteSession(event: H3Event) {
  const sessionId = getCookie(event, SESSION_COOKIE_NAME)
  if (sessionId) {
    await db.delete(tables.sessions).where(eq(tables.sessions.id, sessionId))
  }
  deleteCookie(event, SESSION_COOKIE_NAME, { path: "/" })
}
