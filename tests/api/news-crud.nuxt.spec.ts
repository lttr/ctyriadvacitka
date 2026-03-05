// @vitest-environment node
import { createClient } from "@libsql/client"
import { drizzle } from "drizzle-orm/libsql"
import { beforeAll, describe, expect, it } from "vitest"
import { setup, $fetch, fetch } from "@nuxt/test-utils/e2e"

import { seedDatabase } from "~~/scripts/seed"
import * as schema from "~~/server/db/schema"

describe("news CRUD API tests", async () => {
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

  // --- POST /api/news ---

  describe("POST /api/news", () => {
    it("creates a news item with valid data as editor", async () => {
      const sessionCookie = await loginAs("editor", "editor123")

      const newsItem = await $fetch("/api/news", {
        method: "POST",
        headers: { cookie: sessionCookie },
        body: {
          title: "Nová novinka",
          content: "<p>Obsah nové novinky.</p>",
          author: "editor",
          datetime: "2026-03-05T10:00:00.000Z",
        },
      })

      expect(newsItem).toHaveProperty("id")
      expect(newsItem.title).toBe("Nová novinka")
      expect(newsItem.content).toBe("<p>Obsah nové novinky.</p>")
      expect(newsItem.author).toBe("editor")
      expect(newsItem.datetime).toBe("2026-03-05T10:00:00.000Z")
    })

    it("creates a news item as admin", async () => {
      const sessionCookie = await loginAs("admin", "admin123")

      const newsItem = await $fetch("/api/news", {
        method: "POST",
        headers: { cookie: sessionCookie },
        body: {
          title: "Novinka od admina",
          content: "<p>Admin obsah.</p>",
          author: "admin",
          datetime: "2026-03-05T11:00:00.000Z",
        },
      })

      expect(newsItem.title).toBe("Novinka od admina")
      expect(newsItem.author).toBe("admin")
    })

    it("creates a news item with minimal data (title only)", async () => {
      const sessionCookie = await loginAs("editor", "editor123")

      const newsItem = await $fetch("/api/news", {
        method: "POST",
        headers: { cookie: sessionCookie },
        body: {
          title: "Minimální novinka",
        },
      })

      expect(newsItem).toHaveProperty("id")
      expect(newsItem.title).toBe("Minimální novinka")
      expect(newsItem.content).toBeNull()
      expect(newsItem.author).toBeNull()
      expect(newsItem.datetime).toBeNull()
    })

    it("rejects missing title", async () => {
      const sessionCookie = await loginAs("editor", "editor123")

      await expect(
        $fetch("/api/news", {
          method: "POST",
          headers: { cookie: sessionCookie },
          body: {
            content: "<p>Obsah bez titulku.</p>",
          },
        }),
      ).rejects.toMatchObject({ statusCode: 400 })
    })

    it("returns 401 for unauthenticated request", async () => {
      await expect(
        $fetch("/api/news", {
          method: "POST",
          body: {
            title: "Test",
            content: "<p>Test.</p>",
          },
        }),
      ).rejects.toMatchObject({ statusCode: 401 })
    })

    it("returns 403 for registered user", async () => {
      const sessionCookie = await loginAs("uzivatel", "user123")

      await expect(
        $fetch("/api/news", {
          method: "POST",
          headers: { cookie: sessionCookie },
          body: {
            title: "Test",
            content: "<p>Test.</p>",
          },
        }),
      ).rejects.toMatchObject({ statusCode: 403 })
    })
  })

  // --- PUT /api/news/[id] ---

  describe("PUT /api/news/[id]", () => {
    it("updates an existing news item", async () => {
      const sessionCookie = await loginAs("editor", "editor123")

      // Get the list to find an existing news item id
      const list = await $fetch("/api/news?perPage=50")
      const existingItem = list.items.find(
        (n: { title: string }) => n.title === "Nová novinka",
      )

      const updated = await $fetch(`/api/news/${existingItem.id}`, {
        method: "PUT",
        headers: { cookie: sessionCookie },
        body: {
          title: "Aktualizovaná novinka",
          content: "<p>Aktualizovaný obsah.</p>",
        },
      })

      expect(updated.title).toBe("Aktualizovaná novinka")
      expect(updated.content).toBe("<p>Aktualizovaný obsah.</p>")
    })

    it("partially updates a news item (title only)", async () => {
      const sessionCookie = await loginAs("editor", "editor123")

      const list = await $fetch("/api/news?perPage=50")
      const existingItem = list.items.find(
        (n: { title: string }) => n.title === "Novinka od admina",
      )

      const updated = await $fetch(`/api/news/${existingItem.id}`, {
        method: "PUT",
        headers: { cookie: sessionCookie },
        body: {
          title: "Přejmenovaná novinka",
        },
      })

      expect(updated.title).toBe("Přejmenovaná novinka")
      expect(updated.content).toBe("<p>Admin obsah.</p>") // unchanged
    })

    it("returns 404 for non-existent news item", async () => {
      const sessionCookie = await loginAs("editor", "editor123")

      await expect(
        $fetch("/api/news/99999", {
          method: "PUT",
          headers: { cookie: sessionCookie },
          body: { title: "Test" },
        }),
      ).rejects.toMatchObject({ statusCode: 404 })
    })

    it("returns 400 for invalid id parameter", async () => {
      const sessionCookie = await loginAs("editor", "editor123")

      await expect(
        $fetch("/api/news/not-a-number", {
          method: "PUT",
          headers: { cookie: sessionCookie },
          body: { title: "Test" },
        }),
      ).rejects.toMatchObject({ statusCode: 400 })
    })

    it("returns 401 for unauthenticated request", async () => {
      await expect(
        $fetch("/api/news/1", {
          method: "PUT",
          body: { title: "Test" },
        }),
      ).rejects.toMatchObject({ statusCode: 401 })
    })

    it("returns 403 for registered user", async () => {
      const sessionCookie = await loginAs("uzivatel", "user123")

      await expect(
        $fetch("/api/news/1", {
          method: "PUT",
          headers: { cookie: sessionCookie },
          body: { title: "Test" },
        }),
      ).rejects.toMatchObject({ statusCode: 403 })
    })
  })

  // --- DELETE /api/news/[id] ---

  describe("DELETE /api/news/[id]", () => {
    it("deletes an existing news item", async () => {
      const sessionCookie = await loginAs("editor", "editor123")

      const list = await $fetch("/api/news?perPage=50")
      const existingItem = list.items.find(
        (n: { title: string }) => n.title === "Minimální novinka",
      )

      const result = await $fetch(`/api/news/${existingItem.id}`, {
        method: "DELETE",
        headers: { cookie: sessionCookie },
      })

      expect(result).toHaveProperty("success", true)

      // Verify news item no longer exists
      await expect(
        $fetch(`/api/news/${existingItem.id}`),
      ).rejects.toMatchObject({ statusCode: 404 })
    })

    it("returns 404 for non-existent news item", async () => {
      const sessionCookie = await loginAs("editor", "editor123")

      await expect(
        $fetch("/api/news/99999", {
          method: "DELETE",
          headers: { cookie: sessionCookie },
        }),
      ).rejects.toMatchObject({ statusCode: 404 })
    })

    it("returns 400 for invalid id parameter", async () => {
      const sessionCookie = await loginAs("editor", "editor123")

      await expect(
        $fetch("/api/news/not-a-number", {
          method: "DELETE",
          headers: { cookie: sessionCookie },
        }),
      ).rejects.toMatchObject({ statusCode: 400 })
    })

    it("returns 401 for unauthenticated request", async () => {
      await expect(
        $fetch("/api/news/1", {
          method: "DELETE",
        }),
      ).rejects.toMatchObject({ statusCode: 401 })
    })

    it("returns 403 for registered user", async () => {
      const sessionCookie = await loginAs("uzivatel", "user123")

      await expect(
        $fetch("/api/news/1", {
          method: "DELETE",
          headers: { cookie: sessionCookie },
        }),
      ).rejects.toMatchObject({ statusCode: 403 })
    })
  })
})
