// @vitest-environment node
import { createClient } from "@libsql/client"
import { drizzle } from "drizzle-orm/libsql"
import { beforeAll, describe, expect, it } from "vitest"
import { setup, $fetch, fetch } from "@nuxt/test-utils/e2e"

import { seedDatabase } from "~~/scripts/seed"
import * as schema from "~~/server/db/schema"

describe("auth API integration tests", async () => {
  await setup({ server: true })

  beforeAll(async () => {
    const client = createClient({ url: "file:.data/db/sqlite.db" })
    const seedDb = drizzle(client, { schema })

    await client.executeMultiple(`
      DELETE FROM sessions;
      DELETE FROM articles;
      DELETE FROM news;
      DELETE FROM users;
      DELETE FROM site_settings;
    `)
    await seedDatabase(seedDb)
    client.close()
  })

  // Helper to login and get session cookie
  async function loginAs(username: string, password: string): Promise<string> {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ username, password }),
    })
    const cookies = response.headers.get("set-cookie") || ""
    return cookies.split(";")[0]
  }

  // --- Registration ---

  describe("POST /api/auth/register", () => {
    it("registers a new user with valid data", async () => {
      const result = await $fetch("/api/auth/register", {
        method: "POST",
        body: {
          username: "novyclen",
          password: "heslo12345",
          name: "Karel",
          surname: "Nový",
          email: "karel@example.cz",
        },
      })

      expect(result).toHaveProperty("user")
      expect(result.user.username).toBe("novyclen")
      expect(result.user.name).toBe("Karel")
      expect(result.user.surname).toBe("Nový")
      expect(result.user.role).toBe("registered")
      // Password must not be returned
      expect(result.user).not.toHaveProperty("password")
    })

    it("rejects registration with duplicate username", async () => {
      await expect(
        $fetch("/api/auth/register", {
          method: "POST",
          body: {
            username: "admin",
            password: "heslo12345",
            name: "Jiný",
            surname: "Admin",
            email: "jiny@example.cz",
          },
        }),
      ).rejects.toMatchObject({ statusCode: 409 })
    })

    it("rejects registration with duplicate email", async () => {
      await expect(
        $fetch("/api/auth/register", {
          method: "POST",
          body: {
            username: "uniqueuser",
            password: "heslo12345",
            name: "Jiný",
            surname: "User",
            email: "admin@24hk.cz",
          },
        }),
      ).rejects.toMatchObject({ statusCode: 409 })
    })

    it("rejects registration with missing username", async () => {
      await expect(
        $fetch("/api/auth/register", {
          method: "POST",
          body: {
            password: "heslo12345",
            name: "Test",
            surname: "User",
            email: "test@example.cz",
          },
        }),
      ).rejects.toMatchObject({ statusCode: 400 })
    })

    it("rejects registration with missing password", async () => {
      await expect(
        $fetch("/api/auth/register", {
          method: "POST",
          body: {
            username: "testuser",
            name: "Test",
            surname: "User",
            email: "test@example.cz",
          },
        }),
      ).rejects.toMatchObject({ statusCode: 400 })
    })

    it("rejects registration with short password", async () => {
      await expect(
        $fetch("/api/auth/register", {
          method: "POST",
          body: {
            username: "testuser2",
            password: "abc",
            name: "Test",
            surname: "User",
            email: "test2@example.cz",
          },
        }),
      ).rejects.toMatchObject({ statusCode: 400 })
    })
  })

  // --- Login ---

  describe("POST /api/auth/login", () => {
    it("logs in with valid credentials and returns session cookie", async () => {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          username: "admin",
          password: "admin123",
        }),
      })

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data).toHaveProperty("user")
      expect(data.user.username).toBe("admin")
      expect(data.user.role).toBe("admin")
      expect(data.user).not.toHaveProperty("password")

      // Should set a session cookie
      const cookies = response.headers.get("set-cookie")
      expect(cookies).toBeTruthy()
      expect(cookies).toContain("session")
    })

    it("rejects login with wrong password", async () => {
      await expect(
        $fetch("/api/auth/login", {
          method: "POST",
          body: {
            username: "admin",
            password: "wrongpassword",
          },
        }),
      ).rejects.toMatchObject({ statusCode: 401 })
    })

    it("rejects login with non-existent username", async () => {
      await expect(
        $fetch("/api/auth/login", {
          method: "POST",
          body: {
            username: "neexistuje",
            password: "heslo12345",
          },
        }),
      ).rejects.toMatchObject({ statusCode: 401 })
    })

    it("rejects login with missing fields", async () => {
      await expect(
        $fetch("/api/auth/login", {
          method: "POST",
          body: {},
        }),
      ).rejects.toMatchObject({ statusCode: 400 })
    })
  })

  // --- Session ---

  describe("GET /api/auth/session", () => {
    it("returns current user when authenticated", async () => {
      const sessionCookie = await loginAs("editor", "editor123")

      const session = await $fetch("/api/auth/session", {
        headers: { cookie: sessionCookie },
      })

      expect(session).toHaveProperty("user")
      expect(session.user.username).toBe("editor")
      expect(session.user.role).toBe("editor")
      expect(session.user).not.toHaveProperty("password")
    })

    it("returns 401 when not authenticated", async () => {
      await expect($fetch("/api/auth/session")).rejects.toMatchObject({
        statusCode: 401,
      })
    })

    it("returns 401 with invalid session cookie", async () => {
      await expect(
        $fetch("/api/auth/session", {
          headers: { cookie: "session=invalid-session-id" },
        }),
      ).rejects.toMatchObject({ statusCode: 401 })
    })
  })

  // --- Logout ---

  describe("POST /api/auth/logout", () => {
    it("logs out and invalidates session", async () => {
      const sessionCookie = await loginAs("admin", "admin123")

      // Logout
      const logoutResult = await $fetch("/api/auth/logout", {
        method: "POST",
        headers: { cookie: sessionCookie },
      })

      expect(logoutResult).toHaveProperty("success", true)

      // Session should now be invalid
      await expect(
        $fetch("/api/auth/session", {
          headers: { cookie: sessionCookie },
        }),
      ).rejects.toMatchObject({ statusCode: 401 })
    })
  })

  // --- Authorization utilities ---

  describe("authorization helpers", () => {
    it("requireAuth returns 401 for unauthenticated requests", async () => {
      await expect($fetch("/api/auth/session")).rejects.toMatchObject({
        statusCode: 401,
      })
    })

    it("authenticated user can access protected resources", async () => {
      const sessionCookie = await loginAs("admin", "admin123")

      const session = await $fetch("/api/auth/session", {
        headers: { cookie: sessionCookie },
      })

      expect(session.user.username).toBe("admin")
    })
  })
})
