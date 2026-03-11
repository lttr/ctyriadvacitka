// @vitest-environment node
import { createClient } from "@libsql/client"
import { drizzle } from "drizzle-orm/libsql"
import { beforeAll, describe, expect, it } from "vitest"
import { setup, $fetch, fetch } from "@nuxt/test-utils/e2e"

import { seedDatabase } from "~~/scripts/seed"
import * as schema from "~~/server/db/schema"

describe("article CRUD API tests", async () => {
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

  // --- POST /api/articles ---

  describe("POST /api/articles", () => {
    it("creates an article with valid data as editor", async () => {
      const sessionCookie = await loginAs("editor", "editor123")

      const article = await $fetch("/api/articles", {
        method: "POST",
        headers: { cookie: sessionCookie },
        body: {
          title: "Nový článek",
          url: "novy-clanek",
          content: "<p>Obsah nového článku.</p>",
          author: "editor",
          datetime: "2026-03-05T10:00:00.000Z",
        },
      })

      expect(article).toHaveProperty("id")
      expect(article.title).toBe("Nový článek")
      expect(article.url).toBe("novy-clanek")
      expect(article.content).toBe("<p>Obsah nového článku.</p>")
      expect(article.author).toBe("editor")
      expect(article.inMenu).toBe(false)
      expect(article.requestable).toBe(true)
    })

    it("creates an article as admin", async () => {
      const sessionCookie = await loginAs("admin", "admin123")

      const article = await $fetch("/api/articles", {
        method: "POST",
        headers: { cookie: sessionCookie },
        body: {
          title: "Článek od admina",
          url: "clanek-od-admina",
          content: "<p>Admin obsah.</p>",
          author: "admin",
          datetime: "2026-03-05T11:00:00.000Z",
        },
      })

      expect(article.title).toBe("Článek od admina")
      expect(article.url).toBe("clanek-od-admina")
    })

    it("creates an article with inMenu and requestable flags", async () => {
      const sessionCookie = await loginAs("editor", "editor123")

      const article = await $fetch("/api/articles", {
        method: "POST",
        headers: { cookie: sessionCookie },
        body: {
          title: "Článek v menu",
          url: "clanek-v-menu",
          content: "<p>V menu.</p>",
          inMenu: true,
          requestable: true,
          author: "editor",
          datetime: "2026-03-05T12:00:00.000Z",
        },
      })

      expect(article.inMenu).toBe(true)
      expect(article.requestable).toBe(true)
    })

    it("rejects duplicate url", async () => {
      const sessionCookie = await loginAs("editor", "editor123")

      await expect(
        $fetch("/api/articles", {
          method: "POST",
          headers: { cookie: sessionCookie },
          body: {
            title: "Duplicitní URL",
            url: "o-nas", // already exists in seed
            content: "<p>Obsah.</p>",
            author: "editor",
            datetime: "2026-03-05T13:00:00.000Z",
          },
        }),
      ).rejects.toMatchObject({ statusCode: 409 })
    })

    it("rejects missing title", async () => {
      const sessionCookie = await loginAs("editor", "editor123")

      await expect(
        $fetch("/api/articles", {
          method: "POST",
          headers: { cookie: sessionCookie },
          body: {
            url: "bez-titulku",
            content: "<p>Obsah.</p>",
          },
        }),
      ).rejects.toMatchObject({ statusCode: 400 })
    })

    it("rejects missing url", async () => {
      const sessionCookie = await loginAs("editor", "editor123")

      await expect(
        $fetch("/api/articles", {
          method: "POST",
          headers: { cookie: sessionCookie },
          body: {
            title: "Bez URL",
            content: "<p>Obsah.</p>",
          },
        }),
      ).rejects.toMatchObject({ statusCode: 400 })
    })

    it("returns 401 for unauthenticated request", async () => {
      await expect(
        $fetch("/api/articles", {
          method: "POST",
          body: {
            title: "Test",
            url: "test-unauth",
            content: "<p>Test.</p>",
          },
        }),
      ).rejects.toMatchObject({ statusCode: 401 })
    })

    it("returns 403 for registered user", async () => {
      const sessionCookie = await loginAs("uzivatel", "user123")

      await expect(
        $fetch("/api/articles", {
          method: "POST",
          headers: { cookie: sessionCookie },
          body: {
            title: "Test",
            url: "test-registered",
            content: "<p>Test.</p>",
          },
        }),
      ).rejects.toMatchObject({ statusCode: 403 })
    })
  })

  // --- PUT /api/articles/[url] ---

  describe("PUT /api/articles/[url]", () => {
    it("updates an existing article", async () => {
      const sessionCookie = await loginAs("editor", "editor123")

      const updated = await $fetch("/api/articles/novy-clanek", {
        method: "PUT",
        headers: { cookie: sessionCookie },
        body: {
          title: "Aktualizovaný článek",
          content: "<p>Aktualizovaný obsah.</p>",
        },
      })

      expect(updated.title).toBe("Aktualizovaný článek")
      expect(updated.content).toBe("<p>Aktualizovaný obsah.</p>")
      expect(updated.url).toBe("novy-clanek") // url unchanged
    })

    it("updates article url", async () => {
      const sessionCookie = await loginAs("editor", "editor123")

      const updated = await $fetch("/api/articles/clanek-v-menu", {
        method: "PUT",
        headers: { cookie: sessionCookie },
        body: {
          url: "clanek-v-menu-novy",
        },
      })

      expect(updated.url).toBe("clanek-v-menu-novy")

      // Verify old url no longer works
      await expect($fetch("/api/articles/clanek-v-menu")).rejects.toMatchObject(
        { statusCode: 404 },
      )
    })

    it("rejects url change to an existing url", async () => {
      const sessionCookie = await loginAs("editor", "editor123")

      await expect(
        $fetch("/api/articles/novy-clanek", {
          method: "PUT",
          headers: { cookie: sessionCookie },
          body: {
            url: "o-nas", // already exists
          },
        }),
      ).rejects.toMatchObject({ statusCode: 409 })
    })

    it("returns 404 for non-existent article", async () => {
      const sessionCookie = await loginAs("editor", "editor123")

      await expect(
        $fetch("/api/articles/neexistujici-clanek", {
          method: "PUT",
          headers: { cookie: sessionCookie },
          body: { title: "Test" },
        }),
      ).rejects.toMatchObject({ statusCode: 404 })
    })

    it("returns 401 for unauthenticated request", async () => {
      await expect(
        $fetch("/api/articles/o-nas", {
          method: "PUT",
          body: { title: "Test" },
        }),
      ).rejects.toMatchObject({ statusCode: 401 })
    })

    it("returns 403 for registered user", async () => {
      const sessionCookie = await loginAs("uzivatel", "user123")

      await expect(
        $fetch("/api/articles/o-nas", {
          method: "PUT",
          headers: { cookie: sessionCookie },
          body: { title: "Test" },
        }),
      ).rejects.toMatchObject({ statusCode: 403 })
    })
  })

  // --- DELETE /api/articles/[url] ---

  describe("DELETE /api/articles/[url]", () => {
    it("deletes an existing article", async () => {
      const sessionCookie = await loginAs("editor", "editor123")

      const result = await $fetch("/api/articles/clanek-od-admina", {
        method: "DELETE",
        headers: { cookie: sessionCookie },
      })

      expect(result).toHaveProperty("success", true)

      // Verify article no longer exists
      await expect(
        $fetch("/api/articles/clanek-od-admina"),
      ).rejects.toMatchObject({ statusCode: 404 })
    })

    it("returns 404 for non-existent article", async () => {
      const sessionCookie = await loginAs("editor", "editor123")

      await expect(
        $fetch("/api/articles/neexistujici-clanek", {
          method: "DELETE",
          headers: { cookie: sessionCookie },
        }),
      ).rejects.toMatchObject({ statusCode: 404 })
    })

    it("returns 401 for unauthenticated request", async () => {
      await expect(
        $fetch("/api/articles/o-nas", {
          method: "DELETE",
        }),
      ).rejects.toMatchObject({ statusCode: 401 })
    })

    it("returns 403 for registered user", async () => {
      const sessionCookie = await loginAs("uzivatel", "user123")

      await expect(
        $fetch("/api/articles/o-nas", {
          method: "DELETE",
          headers: { cookie: sessionCookie },
        }),
      ).rejects.toMatchObject({ statusCode: 403 })
    })
  })

  // --- PATCH /api/articles/[url]/toggle-menu ---

  describe("PATCH /api/articles/[url]/toggle-menu", () => {
    it("toggles inMenu from false to true", async () => {
      const sessionCookie = await loginAs("editor", "editor123")

      // "historie" has inMenu: false in seed
      const result = await $fetch("/api/articles/historie/toggle-menu", {
        method: "PATCH",
        headers: { cookie: sessionCookie },
      })

      expect(result.inMenu).toBe(true)
    })

    it("toggles inMenu from true to false", async () => {
      const sessionCookie = await loginAs("editor", "editor123")

      // "historie" was just toggled to true
      const result = await $fetch("/api/articles/historie/toggle-menu", {
        method: "PATCH",
        headers: { cookie: sessionCookie },
      })

      expect(result.inMenu).toBe(false)
    })

    it("returns 404 for non-existent article", async () => {
      const sessionCookie = await loginAs("editor", "editor123")

      await expect(
        $fetch("/api/articles/neexistujici/toggle-menu", {
          method: "PATCH",
          headers: { cookie: sessionCookie },
        }),
      ).rejects.toMatchObject({ statusCode: 404 })
    })

    it("returns 401 for unauthenticated request", async () => {
      await expect(
        $fetch("/api/articles/historie/toggle-menu", {
          method: "PATCH",
        }),
      ).rejects.toMatchObject({ statusCode: 401 })
    })

    it("returns 403 for registered user", async () => {
      const sessionCookie = await loginAs("uzivatel", "user123")

      await expect(
        $fetch("/api/articles/historie/toggle-menu", {
          method: "PATCH",
          headers: { cookie: sessionCookie },
        }),
      ).rejects.toMatchObject({ statusCode: 403 })
    })
  })

  // --- PATCH /api/articles/[url]/toggle-requestable ---

  describe("PATCH /api/articles/[url]/toggle-requestable", () => {
    it("toggles requestable from false to true", async () => {
      const sessionCookie = await loginAs("editor", "editor123")

      // "historie" has requestable: false in seed
      const result = await $fetch("/api/articles/historie/toggle-requestable", {
        method: "PATCH",
        headers: { cookie: sessionCookie },
      })

      expect(result.requestable).toBe(true)
    })

    it("toggles requestable from true to false", async () => {
      const sessionCookie = await loginAs("editor", "editor123")

      // "historie" was just toggled to true
      const result = await $fetch("/api/articles/historie/toggle-requestable", {
        method: "PATCH",
        headers: { cookie: sessionCookie },
      })

      expect(result.requestable).toBe(false)
    })

    it("returns 404 for non-existent article", async () => {
      const sessionCookie = await loginAs("editor", "editor123")

      await expect(
        $fetch("/api/articles/neexistujici/toggle-requestable", {
          method: "PATCH",
          headers: { cookie: sessionCookie },
        }),
      ).rejects.toMatchObject({ statusCode: 404 })
    })

    it("returns 401 for unauthenticated request", async () => {
      await expect(
        $fetch("/api/articles/historie/toggle-requestable", {
          method: "PATCH",
        }),
      ).rejects.toMatchObject({ statusCode: 401 })
    })

    it("returns 403 for registered user", async () => {
      const sessionCookie = await loginAs("uzivatel", "user123")

      await expect(
        $fetch("/api/articles/historie/toggle-requestable", {
          method: "PATCH",
          headers: { cookie: sessionCookie },
        }),
      ).rejects.toMatchObject({ statusCode: 403 })
    })
  })
})
