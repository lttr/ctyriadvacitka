// @vitest-environment node
import { createClient } from "@libsql/client"
import { drizzle } from "drizzle-orm/libsql"
import { beforeAll, describe, expect, it } from "vitest"
import { setup, $fetch, fetch } from "@nuxt/test-utils/e2e"

import { seedDatabase } from "~~/scripts/seed"
import * as schema from "~~/server/db/schema"

describe("admin API integration tests", async () => {
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

  // --- Admin Stats ---

  describe("GET /api/admin/stats", () => {
    it("returns correct counts for admin user", async () => {
      const sessionCookie = await loginAs("admin", "admin123")

      const stats = await $fetch("/api/admin/stats", {
        headers: { cookie: sessionCookie },
      })

      expect(stats).toHaveProperty("articleCount")
      expect(stats).toHaveProperty("newsCount")
      expect(stats).toHaveProperty("userCount")
      expect(stats.articleCount).toBe(6)
      expect(stats.newsCount).toBe(11)
      expect(stats.userCount).toBe(3)
    })

    it("returns correct counts for editor user", async () => {
      const sessionCookie = await loginAs("editor", "editor123")

      const stats = await $fetch("/api/admin/stats", {
        headers: { cookie: sessionCookie },
      })

      expect(stats.articleCount).toBe(6)
      expect(stats.newsCount).toBe(11)
      expect(stats.userCount).toBe(3)
    })

    it("returns 401 for unauthenticated request", async () => {
      await expect($fetch("/api/admin/stats")).rejects.toMatchObject({
        statusCode: 401,
      })
    })

    it("returns 403 for registered user", async () => {
      const sessionCookie = await loginAs("uzivatel", "user123")

      await expect(
        $fetch("/api/admin/stats", {
          headers: { cookie: sessionCookie },
        }),
      ).rejects.toMatchObject({
        statusCode: 403,
      })
    })
  })

  // --- Admin Dashboard Page ---

  describe("Admin dashboard page", () => {
    it("renders dashboard for admin user", async () => {
      const sessionCookie = await loginAs("admin", "admin123")

      const html = await $fetch("/administrace", {
        headers: { cookie: sessionCookie },
      })

      expect(html).toContain("Administrace")
    })

    it("renders stats on dashboard", async () => {
      const sessionCookie = await loginAs("admin", "admin123")

      const html = await $fetch("/administrace", {
        headers: { cookie: sessionCookie },
      })

      expect(html).toContain("Články")
      expect(html).toContain("Novinky")
      expect(html).toContain("Uživatelé")
    })

    it("renders admin navigation links", async () => {
      const sessionCookie = await loginAs("admin", "admin123")

      const html = await $fetch("/administrace", {
        headers: { cookie: sessionCookie },
      })

      expect(html).toContain('href="/administrace/clanky"')
      expect(html).toContain('href="/administrace/novinky"')
    })
  })
})
