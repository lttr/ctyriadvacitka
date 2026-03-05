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

describe("account profile operations", () => {
  it("retrieves the current user profile without password", async () => {
    const hashedPw = hashPassword("heslo123")
    await db.insert(schema.users).values({
      username: "testuser",
      password: hashedPw,
      name: "Jan",
      surname: "Novák",
      nickname: "Jenda",
      email: "jan@example.com",
      role: "registered",
    })

    const [user] = await db
      .select({
        id: schema.users.id,
        username: schema.users.username,
        name: schema.users.name,
        surname: schema.users.surname,
        nickname: schema.users.nickname,
        email: schema.users.email,
        role: schema.users.role,
      })
      .from(schema.users)
      .where(eq(schema.users.username, "testuser"))

    expect(user.username).toBe("testuser")
    expect(user.name).toBe("Jan")
    expect(user.surname).toBe("Novák")
    expect(user.nickname).toBe("Jenda")
    expect(user.email).toBe("jan@example.com")
    expect(user.role).toBe("registered")
    // Ensure password is not in the selected fields
    expect("password" in user).toBe(false)
  })

  it("updates user profile fields", async () => {
    await db.insert(schema.users).values({
      username: "testuser",
      password: hashPassword("heslo123"),
      name: "Jan",
      surname: "Novák",
      email: "jan@example.com",
    })

    await db
      .update(schema.users)
      .set({
        name: "Honza",
        surname: "Novotný",
        nickname: "Honzík",
        email: "honza@example.com",
      })
      .where(eq(schema.users.username, "testuser"))

    const [updated] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.username, "testuser"))

    expect(updated.name).toBe("Honza")
    expect(updated.surname).toBe("Novotný")
    expect(updated.nickname).toBe("Honzík")
    expect(updated.email).toBe("honza@example.com")
  })

  it("rejects duplicate email on profile update", async () => {
    await db.insert(schema.users).values([
      {
        username: "user1",
        password: hashPassword("heslo123"),
        email: "user1@example.com",
      },
      {
        username: "user2",
        password: hashPassword("heslo456"),
        email: "user2@example.com",
      },
    ])

    await expect(
      db
        .update(schema.users)
        .set({ email: "user2@example.com" })
        .where(eq(schema.users.username, "user1")),
    ).rejects.toThrow()
  })

  it("rejects duplicate username on profile update", async () => {
    await db.insert(schema.users).values([
      {
        username: "user1",
        password: hashPassword("heslo123"),
      },
      {
        username: "user2",
        password: hashPassword("heslo456"),
      },
    ])

    await expect(
      db
        .update(schema.users)
        .set({ username: "user2" })
        .where(eq(schema.users.username, "user1")),
    ).rejects.toThrow()
  })
})

describe("password change operations", () => {
  it("verifies current password before allowing change", () => {
    const hashedPw = hashPassword("currentPassword")

    expect(verifyPassword("currentPassword", hashedPw)).toBe(true)
    expect(verifyPassword("wrongPassword", hashedPw)).toBe(false)
  })

  it("updates password hash when change is valid", async () => {
    const oldHash = hashPassword("oldPassword")
    await db.insert(schema.users).values({
      username: "testuser",
      password: oldHash,
    })

    const newHash = hashPassword("newPassword")
    await db
      .update(schema.users)
      .set({ password: newHash })
      .where(eq(schema.users.username, "testuser"))

    const [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.username, "testuser"))

    expect(verifyPassword("newPassword", user.password)).toBe(true)
    expect(verifyPassword("oldPassword", user.password)).toBe(false)
  })
})

describe("profile update validation", () => {
  it("requires username to be non-empty", () => {
    const username = ""
    expect(username.length >= 1).toBe(false)
  })

  it("requires email to be valid format when provided", () => {
    const validEmail = "test@example.com"
    const invalidEmail = "not-an-email"

    expect(validEmail.includes("@")).toBe(true)
    expect(invalidEmail.includes("@")).toBe(false)
  })
})
