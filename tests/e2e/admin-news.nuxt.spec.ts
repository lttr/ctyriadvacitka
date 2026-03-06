// @vitest-environment node
import { createClient } from "@libsql/client"
import { drizzle } from "drizzle-orm/libsql"
import { beforeAll, describe, expect, it } from "vitest"
import { setup, $fetch, fetch } from "@nuxt/test-utils/e2e"

import { seedDatabase } from "~~/scripts/seed"
import * as schema from "~~/server/db/schema"

describe("admin news management pages", async () => {
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

  async function loginAs(username: string, password: string): Promise<string> {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ username, password }),
    })
    const cookies = response.headers.get("set-cookie") || ""
    return cookies.split(";")[0]
  }

  // --- News list page ---

  describe("GET /administrace/novinky", () => {
    it("renders news list page for editor", async () => {
      const sessionCookie = await loginAs("editor", "editor123")

      const html = await $fetch("/administrace/novinky", {
        headers: { cookie: sessionCookie },
      })

      expect(html).toContain("Novinky")
      expect(html).toContain("Nova novinka")
    })

    it("renders news list with edit links", async () => {
      const sessionCookie = await loginAs("editor", "editor123")

      const html = await $fetch("/administrace/novinky", {
        headers: { cookie: sessionCookie },
      })

      expect(html).toContain("/administrace/novinky/")
      expect(html).toContain("Upravit")
    })

    it("redirects unauthenticated users", async () => {
      const response = await fetch("/administrace/novinky", {
        redirect: "manual",
      })

      const html = await response.text()
      expect(response.status === 302 || !html.includes("Nova novinka")).toBe(
        true,
      )
    })
  })

  // --- News create page ---

  describe("GET /administrace/novinky/novy", () => {
    it("renders create news form for editor", async () => {
      const sessionCookie = await loginAs("editor", "editor123")

      const html = await $fetch("/administrace/novinky/novy", {
        headers: { cookie: sessionCookie },
      })

      expect(html).toContain("Nova novinka")
      expect(html).toContain("Nazev")
      expect(html).toContain("Obsah")
      expect(html).toContain("Vytvorit")
    })
  })

  // --- News edit page ---

  describe("GET /administrace/novinky/[id]", () => {
    it("renders edit news form with pre-filled data", async () => {
      const sessionCookie = await loginAs("editor", "editor123")

      // Get a news item id from the API
      const list = await $fetch("/api/news?perPage=1", {
        headers: { cookie: sessionCookie },
      })
      const firstItem = list.items[0]

      const html = await $fetch(`/administrace/novinky/${firstItem.id}`, {
        headers: { cookie: sessionCookie },
      })

      expect(html).toContain("Upravit novinku")
      expect(html).toContain(firstItem.title)
      expect(html).toContain("Ulozit")
    })

    it("returns 404 for non-existent news item", async () => {
      const sessionCookie = await loginAs("editor", "editor123")

      await expect(
        $fetch("/administrace/novinky/99999", {
          headers: { cookie: sessionCookie },
        }),
      ).rejects.toMatchObject({ statusCode: 404 })
    })
  })

  // --- News deletion via AJAX ---

  describe("news deletion from list", () => {
    it("creates a news item and then deletes it", async () => {
      const sessionCookie = await loginAs("editor", "editor123")

      // Create a test news item
      const newsItem = await $fetch("/api/news", {
        method: "POST",
        headers: { cookie: sessionCookie },
        body: {
          title: "Novinka ke smazani",
          content: "<p>Tato novinka bude smazana.</p>",
          author: "editor",
          datetime: "2026-03-06T10:00:00.000Z",
        },
      })

      expect(newsItem).toHaveProperty("id")

      // Delete it
      const result = await $fetch(`/api/news/${newsItem.id}`, {
        method: "DELETE",
        headers: { cookie: sessionCookie },
      })

      expect(result).toHaveProperty("success", true)

      // Verify it's gone
      await expect($fetch(`/api/news/${newsItem.id}`)).rejects.toMatchObject({
        statusCode: 404,
      })
    })
  })
})
