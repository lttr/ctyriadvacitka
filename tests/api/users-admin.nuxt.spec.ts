// @vitest-environment node
import { createClient } from "@libsql/client"
import { drizzle } from "drizzle-orm/libsql"
import { beforeAll, describe, expect, it } from "vitest"
import { setup, $fetch, fetch } from "@nuxt/test-utils/e2e"

import { seedDatabase } from "~~/scripts/seed"
import * as schema from "~~/server/db/schema"

describe("user management API (admin only)", async () => {
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

  // --- GET /api/users ---

  describe("GET /api/users", () => {
    it("returns all users for admin", async () => {
      const sessionCookie = await loginAs("admin", "admin123")

      const users = await $fetch("/api/users", {
        headers: { cookie: sessionCookie },
      })

      expect(users).toHaveLength(3)
      expect(users[0]).toHaveProperty("username")
      expect(users[0]).toHaveProperty("role")
      expect(users[0]).not.toHaveProperty("password")
    })

    it("returns users sorted by username", async () => {
      const sessionCookie = await loginAs("admin", "admin123")

      const users = await $fetch("/api/users", {
        headers: { cookie: sessionCookie },
      })

      const usernames = users.map((u: { username: string }) => u.username)
      expect(usernames).toEqual([...usernames].sort())
    })

    it("returns 401 for unauthenticated request", async () => {
      await expect($fetch("/api/users")).rejects.toMatchObject({
        statusCode: 401,
      })
    })

    it("returns 403 for editor", async () => {
      const sessionCookie = await loginAs("editor", "editor123")

      await expect(
        $fetch("/api/users", {
          headers: { cookie: sessionCookie },
        }),
      ).rejects.toMatchObject({
        statusCode: 403,
      })
    })

    it("returns 403 for registered user", async () => {
      const sessionCookie = await loginAs("uzivatel", "user123")

      await expect(
        $fetch("/api/users", {
          headers: { cookie: sessionCookie },
        }),
      ).rejects.toMatchObject({
        statusCode: 403,
      })
    })
  })

  // --- DELETE /api/users/[username] ---

  describe("DELETE /api/users/[username]", () => {
    it("deletes a user as admin", async () => {
      // First register a user to delete
      await fetch("/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          username: "todelete",
          password: "password123",
        }),
      })

      const sessionCookie = await loginAs("admin", "admin123")

      const result = await $fetch("/api/users/todelete", {
        method: "DELETE",
        headers: { cookie: sessionCookie },
      })

      expect(result).toEqual({ success: true })

      // Verify user is gone
      const users = await $fetch("/api/users", {
        headers: { cookie: sessionCookie },
      })
      const usernames = users.map((u: { username: string }) => u.username)
      expect(usernames).not.toContain("todelete")
    })

    it("returns 404 for non-existent user", async () => {
      const sessionCookie = await loginAs("admin", "admin123")

      await expect(
        $fetch("/api/users/neexistuje", {
          method: "DELETE",
          headers: { cookie: sessionCookie },
        }),
      ).rejects.toMatchObject({
        statusCode: 404,
      })
    })

    it("prevents admin from deleting themselves", async () => {
      const sessionCookie = await loginAs("admin", "admin123")

      await expect(
        $fetch("/api/users/admin", {
          method: "DELETE",
          headers: { cookie: sessionCookie },
        }),
      ).rejects.toMatchObject({
        statusCode: 400,
      })
    })

    it("returns 403 for editor", async () => {
      const sessionCookie = await loginAs("editor", "editor123")

      await expect(
        $fetch("/api/users/uzivatel", {
          method: "DELETE",
          headers: { cookie: sessionCookie },
        }),
      ).rejects.toMatchObject({
        statusCode: 403,
      })
    })

    it("returns 401 for unauthenticated request", async () => {
      await expect(
        $fetch("/api/users/uzivatel", {
          method: "DELETE",
        }),
      ).rejects.toMatchObject({
        statusCode: 401,
      })
    })
  })

  // --- PATCH /api/users/[username]/role ---

  describe("PATCH /api/users/[username]/role", () => {
    it("changes user role as admin", async () => {
      const sessionCookie = await loginAs("admin", "admin123")

      const result = await $fetch("/api/users/uzivatel/role", {
        method: "PATCH",
        headers: {
          cookie: sessionCookie,
          "content-type": "application/json",
        },
        body: { role: "editor" },
      })

      expect(result.user.role).toBe("editor")

      // Revert back
      await $fetch("/api/users/uzivatel/role", {
        method: "PATCH",
        headers: {
          cookie: sessionCookie,
          "content-type": "application/json",
        },
        body: { role: "registered" },
      })
    })

    it("rejects invalid role", async () => {
      const sessionCookie = await loginAs("admin", "admin123")

      await expect(
        $fetch("/api/users/uzivatel/role", {
          method: "PATCH",
          headers: {
            cookie: sessionCookie,
            "content-type": "application/json",
          },
          body: { role: "superadmin" },
        }),
      ).rejects.toMatchObject({
        statusCode: 400,
      })
    })

    it("prevents admin from changing own role", async () => {
      const sessionCookie = await loginAs("admin", "admin123")

      await expect(
        $fetch("/api/users/admin/role", {
          method: "PATCH",
          headers: {
            cookie: sessionCookie,
            "content-type": "application/json",
          },
          body: { role: "registered" },
        }),
      ).rejects.toMatchObject({
        statusCode: 400,
      })
    })

    it("returns 404 for non-existent user", async () => {
      const sessionCookie = await loginAs("admin", "admin123")

      await expect(
        $fetch("/api/users/neexistuje/role", {
          method: "PATCH",
          headers: {
            cookie: sessionCookie,
            "content-type": "application/json",
          },
          body: { role: "editor" },
        }),
      ).rejects.toMatchObject({
        statusCode: 404,
      })
    })

    it("returns 403 for editor", async () => {
      const sessionCookie = await loginAs("editor", "editor123")

      await expect(
        $fetch("/api/users/uzivatel/role", {
          method: "PATCH",
          headers: {
            cookie: sessionCookie,
            "content-type": "application/json",
          },
          body: { role: "editor" },
        }),
      ).rejects.toMatchObject({
        statusCode: 403,
      })
    })

    it("returns 401 for unauthenticated request", async () => {
      await expect(
        $fetch("/api/users/uzivatel/role", {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: { role: "editor" },
        }),
      ).rejects.toMatchObject({
        statusCode: 401,
      })
    })
  })
})
