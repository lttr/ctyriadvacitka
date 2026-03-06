import { createClient } from "@libsql/client"
import { eq } from "drizzle-orm"
import { drizzle } from "drizzle-orm/libsql"
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest"

import * as schema from "~~/server/db/schema"
import { hashPassword, verifyPassword } from "~~/server/utils/auth"

const client = createClient({ url: ":memory:" })
const db = drizzle(client, { schema })

beforeAll(() => {
  client.executeMultiple(`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      name TEXT,
      surname TEXT,
      nickname TEXT,
      email TEXT UNIQUE,
      role TEXT NOT NULL DEFAULT 'registered'
    );

    CREATE TABLE sessions (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `)
})

afterAll(() => {
  client.close()
})

beforeEach(async () => {
  await client.executeMultiple(`
    DELETE FROM sessions;
    DELETE FROM users;
  `)
})

describe("password hashing", () => {
  it("hashes password deterministically", () => {
    const hash1 = hashPassword("heslo123")
    const hash2 = hashPassword("heslo123")
    expect(hash1).toBe(hash2)
  })

  it("produces different hashes for different passwords", () => {
    const hash1 = hashPassword("heslo123")
    const hash2 = hashPassword("heslo456")
    expect(hash1).not.toBe(hash2)
  })

  it("verifies correct password", () => {
    const hashed = hashPassword("heslo123")
    expect(verifyPassword("heslo123", hashed)).toBe(true)
  })

  it("rejects incorrect password", () => {
    const hashed = hashPassword("heslo123")
    expect(verifyPassword("spatne", hashed)).toBe(false)
  })
})

describe("registration flow (database level)", () => {
  it("creates a new user with hashed password", async () => {
    const hashedPw = hashPassword("heslo123")
    await db.insert(schema.users).values({
      username: "novyuzivatel",
      password: hashedPw,
      name: "Jan",
      surname: "Novák",
      email: "jan@example.com",
    })

    const [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.username, "novyuzivatel"))

    expect(user.username).toBe("novyuzivatel")
    expect(user.role).toBe("registered")
    expect(verifyPassword("heslo123", user.password)).toBe(true)
  })

  it("rejects duplicate username", async () => {
    await db.insert(schema.users).values({
      username: "existujici",
      password: hashPassword("heslo123"),
    })

    await expect(
      db.insert(schema.users).values({
        username: "existujici",
        password: hashPassword("jineHeslo"),
      }),
    ).rejects.toThrow()
  })

  it("rejects duplicate email", async () => {
    await db.insert(schema.users).values({
      username: "user1",
      password: hashPassword("heslo1"),
      email: "same@example.com",
    })

    await expect(
      db.insert(schema.users).values({
        username: "user2",
        password: hashPassword("heslo2"),
        email: "same@example.com",
      }),
    ).rejects.toThrow()
  })

  it("assigns default role 'registered'", async () => {
    await db.insert(schema.users).values({
      username: "novy",
      password: hashPassword("heslo"),
    })

    const [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.username, "novy"))

    expect(user.role).toBe("registered")
  })
})

describe("login flow (database level)", () => {
  it("finds user by username and verifies password", async () => {
    const hashedPw = hashPassword("spravneHeslo")
    await db.insert(schema.users).values({
      username: "testuser",
      password: hashedPw,
      role: "editor",
    })

    const [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.username, "testuser"))

    expect(user).toBeTruthy()
    expect(verifyPassword("spravneHeslo", user.password)).toBe(true)
    expect(verifyPassword("spatneHeslo", user.password)).toBe(false)
  })

  it("returns null for non-existent username", async () => {
    const user = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.username, "neexistujici"))
      .get()

    expect(user).toBeUndefined()
  })
})

describe("session management (database level)", () => {
  it("creates a session for a user", async () => {
    const [user] = await db
      .insert(schema.users)
      .values({
        username: "testuser",
        password: hashPassword("heslo"),
      })
      .returning()

    const sessionId = crypto.randomUUID()
    const now = new Date()
    const expiresAt = new Date(now.getTime() + 30 * 60 * 1000)

    await db.insert(schema.sessions).values({
      id: sessionId,
      userId: user.id,
      expiresAt: expiresAt.toISOString(),
      createdAt: now.toISOString(),
    })

    const [session] = await db
      .select()
      .from(schema.sessions)
      .where(eq(schema.sessions.id, sessionId))

    expect(session).toBeTruthy()
    expect(session.userId).toBe(user.id)
  })

  it("deletes session on logout", async () => {
    const [user] = await db
      .insert(schema.users)
      .values({
        username: "testuser",
        password: hashPassword("heslo"),
      })
      .returning()

    const sessionId = crypto.randomUUID()
    await db.insert(schema.sessions).values({
      id: sessionId,
      userId: user.id,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
    })

    await db.delete(schema.sessions).where(eq(schema.sessions.id, sessionId))

    const session = await db
      .select()
      .from(schema.sessions)
      .where(eq(schema.sessions.id, sessionId))
      .get()

    expect(session).toBeUndefined()
  })

  it("session joins with user to return user data", async () => {
    const [user] = await db
      .insert(schema.users)
      .values({
        username: "testuser",
        password: hashPassword("heslo"),
        name: "Jan",
        surname: "Novák",
        role: "admin",
      })
      .returning()

    const sessionId = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000)

    await db.insert(schema.sessions).values({
      id: sessionId,
      userId: user.id,
      expiresAt: expiresAt.toISOString(),
      createdAt: new Date().toISOString(),
    })

    const result = await db
      .select({
        id: schema.users.id,
        username: schema.users.username,
        name: schema.users.name,
        surname: schema.users.surname,
        role: schema.users.role,
      })
      .from(schema.sessions)
      .innerJoin(schema.users, eq(schema.sessions.userId, schema.users.id))
      .where(eq(schema.sessions.id, sessionId))
      .get()

    expect(result).toBeTruthy()
    expect(result!.username).toBe("testuser")
    expect(result!.name).toBe("Jan")
    expect(result!.role).toBe("admin")
  })
})
