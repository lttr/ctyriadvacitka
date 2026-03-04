// @vitest-environment node
import { createClient } from "@libsql/client"
import { drizzle } from "drizzle-orm/libsql"
import { beforeAll, describe, expect, it } from "vitest"
import { setup, $fetch } from "@nuxt/test-utils/e2e"

import { seedDatabase } from "~~/scripts/seed"
import * as schema from "~~/server/db/schema"

describe("public API integration tests", async () => {
  // Let NuxtHub build and apply migrations
  await setup({ server: true })

  // Seed the database after NuxtHub has created the tables
  beforeAll(async () => {
    const client = createClient({ url: "file:.data/db/sqlite.db" })
    const seedDb = drizzle(client, { schema })

    // Clear existing data and seed fresh
    await client.executeMultiple(`
      DELETE FROM articles;
      DELETE FROM news;
      DELETE FROM users;
      DELETE FROM site_settings;
    `)
    await seedDatabase(seedDb)
    client.close()
  })

  // --- Articles ---

  describe("GET /api/articles", () => {
    it("returns all articles ordered by datetime DESC", async () => {
      const articles = await $fetch("/api/articles")

      expect(articles).toHaveLength(6)
      // Most recent first (Letní tábor 2026 = 2026-02-15)
      expect(articles[0].title).toBe("Letní tábor 2026")
    })
  })

  describe("GET /api/articles/menu", () => {
    it("returns only articles with inMenu=true", async () => {
      const articles = await $fetch("/api/articles/menu")

      // Seed has 4 inMenu articles: Úvod, O nás, Vedení oddílu, Přihláška
      expect(articles).toHaveLength(4)
      for (const article of articles) {
        expect(article).toHaveProperty("id")
        expect(article).toHaveProperty("title")
        expect(article).toHaveProperty("url")
        // Menu endpoint returns only id, title, url (no content)
        expect(article).not.toHaveProperty("content")
      }
    })

    it("returns articles ordered by title", async () => {
      const articles = await $fetch("/api/articles/menu")
      const titles = articles.map((a: { title: string }) => a.title)

      // SQLite default collation sorts Ú after V
      expect(titles).toEqual([...titles].sort())
    })
  })

  describe("GET /api/articles/[url]", () => {
    it("returns a single article by URL slug", async () => {
      const article = await $fetch("/api/articles/o-nas")

      expect(article.title).toBe("O nás")
      expect(article.url).toBe("o-nas")
      expect(article.content).toContain("skautský oddíl")
    })

    it("returns 404 for non-existent slug", async () => {
      await expect($fetch("/api/articles/non-existent")).rejects.toMatchObject({
        statusCode: 404,
      })
    })
  })

  // --- News ---

  describe("GET /api/news/recent", () => {
    it("returns exactly 5 most recent news items", async () => {
      const news = await $fetch("/api/news/recent")

      expect(news).toHaveLength(5)
      // Most recent is "Schůzka s rodiči" (2026-03-04)
      expect(news[0].title).toBe("Schůzka s rodiči")
    })

    it("returns news ordered by datetime DESC", async () => {
      const news = await $fetch("/api/news/recent")
      const dates = news.map((n: { datetime: string }) => n.datetime)

      for (let i = 0; i < dates.length - 1; i++) {
        expect(dates[i] >= dates[i + 1]).toBe(true)
      }
    })
  })

  describe("GET /api/news", () => {
    it("returns paginated news with default page=1 perPage=10", async () => {
      const result = await $fetch("/api/news")

      expect(result.page).toBe(1)
      expect(result.perPage).toBe(10)
      expect(result.items).toHaveLength(10) // 11 total, page 1 = 10
    })

    it("supports page and perPage query params", async () => {
      const result = await $fetch("/api/news?page=2&perPage=5")

      expect(result.page).toBe(2)
      expect(result.perPage).toBe(5)
      expect(result.items).toHaveLength(5) // 11 total, page 2 of 5 = items 6-10
    })

    it("clamps perPage to max 50", async () => {
      const result = await $fetch("/api/news?perPage=100")

      expect(result.perPage).toBe(50)
    })

    it("clamps page to min 1", async () => {
      const result = await $fetch("/api/news?page=-1")

      expect(result.page).toBe(1)
    })
  })

  // --- Settings ---

  describe("GET /api/settings", () => {
    it("returns all settings as key-value object", async () => {
      const settings = await $fetch("/api/settings")

      expect(settings.siteName).toBe("24. oddíl Junáka Hradec Králové")
      expect(settings.contactEmail).toBe("info@24hk.cz")
      expect(settings.contactPhone).toBe("+420 123 456 789")
      expect(settings.contactAddress).toContain("Hradec Králové")
      expect(settings).toHaveProperty("introArticleId")
      expect(settings).toHaveProperty("googleCalendarId")
    })
  })

  describe("GET /api/settings/[key]", () => {
    it("returns a single setting by key", async () => {
      const setting = await $fetch("/api/settings/siteName")

      expect(setting.key).toBe("siteName")
      expect(setting.value).toBe("24. oddíl Junáka Hradec Králové")
    })

    it("returns 404 for non-existent key", async () => {
      await expect(
        $fetch("/api/settings/nonExistentKey"),
      ).rejects.toMatchObject({
        statusCode: 404,
      })
    })
  })
})
