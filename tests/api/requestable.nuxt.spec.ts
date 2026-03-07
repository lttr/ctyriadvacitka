// @vitest-environment node
import { createClient } from "@libsql/client"
import { drizzle } from "drizzle-orm/libsql"
import { beforeAll, describe, expect, it } from "vitest"
import { setup, $fetch, fetch } from "@nuxt/test-utils/e2e"

import { seedDatabase } from "~~/scripts/seed"
import * as schema from "~~/server/db/schema"

describe("requestable article filtering", async () => {
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

  // Seed data has:
  // requestable: true  -> "Přihláška do oddílu", "Letní tábor 2026"
  // requestable: false -> "Úvod", "O nás", "Vedení oddílu", "Historie oddílu"

  describe("GET /api/articles (public list)", () => {
    it("returns only requestable articles for unauthenticated users", async () => {
      const result = await $fetch("/api/articles")

      const titles = result.items.map((a: { title: string }) => a.title)
      expect(titles).toContain("Přihláška do oddílu")
      expect(titles).toContain("Letní tábor 2026")
      expect(titles).not.toContain("Úvod")
      expect(titles).not.toContain("O nás")
      expect(titles).not.toContain("Vedení oddílu")
      expect(titles).not.toContain("Historie oddílu")
      expect(result.totalCount).toBe(2)
    })

    it("returns only requestable articles for registered users", async () => {
      const sessionCookie = await loginAs("uzivatel", "user123")

      const result = await $fetch("/api/articles", {
        headers: { cookie: sessionCookie },
      })

      const titles = result.items.map((a: { title: string }) => a.title)
      expect(titles).toContain("Přihláška do oddílu")
      expect(titles).toContain("Letní tábor 2026")
      expect(titles).not.toContain("Úvod")
      expect(result.totalCount).toBe(2)
    })

    it("returns all articles for editors", async () => {
      const sessionCookie = await loginAs("editor", "editor123")

      const result = await $fetch("/api/articles", {
        headers: { cookie: sessionCookie },
      })

      const titles = result.items.map((a: { title: string }) => a.title)
      expect(titles).toContain("Přihláška do oddílu")
      expect(titles).toContain("Letní tábor 2026")
      expect(titles).toContain("Úvod")
      expect(titles).toContain("O nás")
      expect(titles).toContain("Vedení oddílu")
      expect(titles).toContain("Historie oddílu")
      expect(result.totalCount).toBe(6)
    })

    it("returns all articles for admins", async () => {
      const sessionCookie = await loginAs("admin", "admin123")

      const result = await $fetch("/api/articles", {
        headers: { cookie: sessionCookie },
      })

      expect(result.totalCount).toBe(6)
    })

    it("applies requestable filter together with search", async () => {
      // "tábor" appears in "Letní tábor 2026" (requestable: true)
      // and in content of no non-requestable articles
      const result = await $fetch("/api/articles?search=tábor")

      const titles = result.items.map((a: { title: string }) => a.title)
      expect(titles).toContain("Letní tábor 2026")
      expect(result.totalCount).toBe(1)
    })

    it("search excludes non-requestable articles for guests", async () => {
      // "vedení" appears in "Vedení oddílu" (requestable: false)
      const result = await $fetch("/api/articles?search=vedení")

      expect(result.items).toHaveLength(0)
      expect(result.totalCount).toBe(0)
    })

    it("search includes non-requestable articles for editors", async () => {
      const sessionCookie = await loginAs("editor", "editor123")

      // "vedení" appears in "Vedení oddílu" (requestable: false)
      const result = await $fetch("/api/articles?search=vedení", {
        headers: { cookie: sessionCookie },
      })

      const titles = result.items.map((a: { title: string }) => a.title)
      expect(titles).toContain("Vedení oddílu")
      expect(result.totalCount).toBeGreaterThanOrEqual(1)
    })

    it("returns correct pagination with requestable filter", async () => {
      const result = await $fetch("/api/articles?perPage=1&page=1")

      expect(result.items).toHaveLength(1)
      expect(result.totalCount).toBe(2)
      expect(result.page).toBe(1)
    })
  })
})
