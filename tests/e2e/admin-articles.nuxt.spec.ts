// @vitest-environment node
import { createClient } from "@libsql/client"
import { drizzle } from "drizzle-orm/libsql"
import { beforeAll, describe, expect, it } from "vitest"
import { setup, $fetch, fetch } from "@nuxt/test-utils/e2e"

import { seedDatabase } from "~~/scripts/seed"
import * as schema from "~~/server/db/schema"

describe("admin article management pages", async () => {
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

  // --- Article list page ---

  describe("GET /administrace/clanky", () => {
    it("renders article list page for editor", async () => {
      const sessionCookie = await loginAs("editor", "editor123")

      const html = await $fetch("/administrace/clanky", {
        headers: { cookie: sessionCookie },
      })

      expect(html).toContain("Články")
      expect(html).toContain("O nás")
      expect(html).toContain("Vedení oddílu")
      expect(html).toContain("Nový článek")
    })

    it("renders article list with edit links", async () => {
      const sessionCookie = await loginAs("editor", "editor123")

      const html = await $fetch("/administrace/clanky", {
        headers: { cookie: sessionCookie },
      })

      expect(html).toContain('href="/administrace/clanky/o-nas"')
    })

    it("shows inMenu status for articles", async () => {
      const sessionCookie = await loginAs("editor", "editor123")

      const html = await $fetch("/administrace/clanky", {
        headers: { cookie: sessionCookie },
      })

      // Articles with inMenu should show indication
      expect(html).toContain("V menu")
    })

    it("redirects unauthenticated users", async () => {
      const response = await fetch("/administrace/clanky", {
        redirect: "manual",
      })

      // Should redirect (302) or return the redirected page
      const html = await response.text()
      // The admin middleware redirects to /, so we check for absence of admin content
      expect(response.status === 302 || !html.includes("Nový článek")).toBe(
        true,
      )
    })
  })

  // --- Article create page ---

  describe("GET /administrace/clanky/novy", () => {
    it("renders create article form for editor", async () => {
      const sessionCookie = await loginAs("editor", "editor123")

      const html = await $fetch("/administrace/clanky/novy", {
        headers: { cookie: sessionCookie },
      })

      expect(html).toContain("Nový článek")
      expect(html).toContain("Název")
      expect(html).toContain("URL slug")
      expect(html).toContain("Obsah")
      expect(html).toContain("Vytvořit")
    })
  })

  // --- Article edit page ---

  describe("GET /administrace/clanky/[url]", () => {
    it("renders edit article form with pre-filled data", async () => {
      const sessionCookie = await loginAs("editor", "editor123")

      const html = await $fetch("/administrace/clanky/o-nas", {
        headers: { cookie: sessionCookie },
      })

      expect(html).toContain("Upravit článek")
      expect(html).toContain("O nás")
      expect(html).toContain("o-nas")
      expect(html).toContain("Uložit")
    })

    it("returns 404 for non-existent article", async () => {
      const sessionCookie = await loginAs("editor", "editor123")

      await expect(
        $fetch("/administrace/clanky/neexistujici-clanek", {
          headers: { cookie: sessionCookie },
        }),
      ).rejects.toMatchObject({ statusCode: 404 })
    })
  })

  // --- Article deletion via AJAX ---

  describe("article deletion from list", () => {
    it("creates an article and then deletes it", async () => {
      const sessionCookie = await loginAs("editor", "editor123")

      // Create a test article
      const article = await $fetch("/api/articles", {
        method: "POST",
        headers: { cookie: sessionCookie },
        body: {
          title: "Článek ke smazání",
          url: "clanek-ke-smazani",
          content: "<p>Tento článek bude smazán.</p>",
          author: "editor",
          datetime: "2026-03-06T10:00:00.000Z",
        },
      })

      expect(article.url).toBe("clanek-ke-smazani")

      // Delete it
      const result = await $fetch("/api/articles/clanek-ke-smazani", {
        method: "DELETE",
        headers: { cookie: sessionCookie },
      })

      expect(result).toHaveProperty("success", true)

      // Verify it's gone
      await expect(
        $fetch("/api/articles/clanek-ke-smazani"),
      ).rejects.toMatchObject({ statusCode: 404 })
    })
  })

  // --- Toggle inMenu from list ---

  describe("toggle inMenu from list", () => {
    it("toggles article menu visibility", async () => {
      const sessionCookie = await loginAs("editor", "editor123")

      // historie has inMenu: false in seed
      const result = await $fetch("/api/articles/historie/toggle-menu", {
        method: "PATCH",
        headers: { cookie: sessionCookie },
      })

      expect(result.inMenu).toBe(true)

      // Toggle back
      const result2 = await $fetch("/api/articles/historie/toggle-menu", {
        method: "PATCH",
        headers: { cookie: sessionCookie },
      })

      expect(result2.inMenu).toBe(false)
    })
  })

  // --- Toggle requestable from list ---

  describe("toggle requestable from list", () => {
    it("toggles article requestable visibility", async () => {
      const sessionCookie = await loginAs("editor", "editor123")

      // historie has requestable: false in seed
      const result = await $fetch("/api/articles/historie/toggle-requestable", {
        method: "PATCH",
        headers: { cookie: sessionCookie },
      })

      expect(result.requestable).toBe(true)

      // Toggle back
      const result2 = await $fetch(
        "/api/articles/historie/toggle-requestable",
        {
          method: "PATCH",
          headers: { cookie: sessionCookie },
        },
      )

      expect(result2.requestable).toBe(false)
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
