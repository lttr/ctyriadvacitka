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
      DELETE FROM sessions;
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
    it("returns only requestable articles for unauthenticated users", async () => {
      const result = await $fetch("/api/articles")

      expect(result.page).toBe(1)
      expect(result.perPage).toBe(10)
      // Only 2 of 6 seed articles are requestable: "Přihláška" and "Letní tábor 2026"
      expect(result.items).toHaveLength(2)
      expect(result.totalCount).toBe(2)
    })

    it("returns articles ordered by datetime DESC", async () => {
      const result = await $fetch("/api/articles")

      // Most recent requestable first (Letní tábor 2026 = 2026-02-15)
      expect(result.items[0].title).toBe("Letní tábor 2026")
    })

    it("supports page and perPage query params", async () => {
      const result = await $fetch("/api/articles?page=1&perPage=1")

      expect(result.page).toBe(1)
      expect(result.perPage).toBe(1)
      expect(result.items).toHaveLength(1)
      expect(result.totalCount).toBe(2)
    })

    it("returns correct items on page 2", async () => {
      const result = await $fetch("/api/articles?page=2&perPage=1")

      expect(result.page).toBe(2)
      expect(result.items).toHaveLength(1)
    })

    it("clamps perPage to max 50", async () => {
      const result = await $fetch("/api/articles?perPage=100")

      expect(result.perPage).toBe(50)
    })

    it("clamps page to min 1", async () => {
      const result = await $fetch("/api/articles?page=-1")

      expect(result.page).toBe(1)
    })
  })

  describe("GET /api/articles/intro", () => {
    it("returns the intro article based on site settings", async () => {
      const article = await $fetch("/api/articles/intro")

      expect(article.title).toBe("Úvod")
      expect(article.url).toBe("uvod")
      expect(article.content).toContain("Vítejte na stránkách 24. oddílu")
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
    it("returns paginated news with default page=1 perPage=10 and totalCount", async () => {
      const result = await $fetch("/api/news")

      expect(result.page).toBe(1)
      expect(result.perPage).toBe(10)
      expect(result.items).toHaveLength(10) // 11 total, page 1 = 10
      expect(result.totalCount).toBe(11)
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
      expect(settings.siteDescription).toBe("Skautský oddíl")
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

  // --- Page rendering ---

  describe("Homepage", () => {
    it("renders paginated news feed", async () => {
      const html = await $fetch("/")

      expect(html).toContain("Novinky")
      expect(html).toContain("Schůzka s rodiči")
    })

    it("renders sidebar navigation with menu articles", async () => {
      const html = await $fetch("/")

      expect(html).toContain("O nás")
      expect(html).toContain("Vedení oddílu")
      expect(html).toContain("Přihláška")
    })

    it("renders recent news in sidebar", async () => {
      const html = await $fetch("/")

      expect(html).toContain("Schůzka s rodiči")
    })
  })

  describe("Article detail page", () => {
    it("renders article content by slug", async () => {
      const html = await $fetch("/o-nas")

      expect(html).toContain("skautský oddíl")
    })

    it("returns 404 for non-existent article", async () => {
      await expect($fetch("/non-existent-article")).rejects.toMatchObject({
        statusCode: 404,
      })
    })
  })

  describe("News list page", () => {
    it("renders paginated news list", async () => {
      const html = await $fetch("/novinky")

      expect(html).toContain("Novinky")
      expect(html).toContain("Schůzka s rodiči")
    })

    it("supports page query parameter", async () => {
      const html = await $fetch("/novinky?stranka=2")

      expect(html).toContain("Novinky")
      // Page 2 with perPage=5 should have items 6-10
      expect(html).toContain("Novinky")
    })
  })

  // --- Contact API ---

  describe("POST /api/contact", () => {
    it("accepts valid contact form submission", async () => {
      const result = await $fetch("/api/contact", {
        method: "POST",
        body: {
          name: "Jan Novák",
          email: "jan@example.cz",
          message: "Chtěl bych se zeptat na přijímání nových členů.",
        },
      })

      expect(result).toHaveProperty("success", true)
    })

    it("rejects submission with missing name", async () => {
      await expect(
        $fetch("/api/contact", {
          method: "POST",
          body: {
            email: "jan@example.cz",
            message: "Chtěl bych se zeptat na přijímání nových členů.",
          },
        }),
      ).rejects.toMatchObject({ statusCode: 400 })
    })

    it("rejects submission with invalid email", async () => {
      await expect(
        $fetch("/api/contact", {
          method: "POST",
          body: {
            name: "Jan Novák",
            email: "not-an-email",
            message: "Chtěl bych se zeptat na přijímání nových členů.",
          },
        }),
      ).rejects.toMatchObject({ statusCode: 400 })
    })

    it("rejects submission with short message", async () => {
      await expect(
        $fetch("/api/contact", {
          method: "POST",
          body: {
            name: "Jan Novák",
            email: "jan@example.cz",
            message: "Ahoj",
          },
        }),
      ).rejects.toMatchObject({ statusCode: 400 })
    })

    it("rejects empty body", async () => {
      await expect(
        $fetch("/api/contact", {
          method: "POST",
          body: {},
        }),
      ).rejects.toMatchObject({ statusCode: 400 })
    })
  })

  // --- Contact page ---

  describe("Contact page", () => {
    it("renders contact page with contact information", async () => {
      const html = await $fetch("/kontakt")

      expect(html).toContain("Kontakt")
      // Email is rendered client-side via ObfuscatedEmail for scraper protection
      expect(html).toContain("+420 123 456 789")
      expect(html).toContain("Hradec Králové")
    })

    it("renders contact form", async () => {
      const html = await $fetch("/kontakt")

      expect(html).toContain("Vaše jméno")
      expect(html).toContain("Email")
      expect(html).toContain("Zpráva")
    })
  })

  // --- Article list page ---

  describe("Article list page", () => {
    it("renders requestable articles for unauthenticated users", async () => {
      const html = await $fetch("/clanky")

      expect(html).toContain("Články")
      // Only requestable articles are shown to unauthenticated users
      expect(html).toContain("Přihláška")
      expect(html).toContain("Letní tábor 2026")
    })

    it("renders article links pointing to detail pages", async () => {
      const html = await $fetch("/clanky")

      expect(html).toContain('href="/prihlaska"')
      expect(html).toContain('href="/letni-tabor-2026"')
    })

    it("renders article authors", async () => {
      const html = await $fetch("/clanky")

      expect(html).toContain("editor")
    })

    it("supports page query parameter for pagination", async () => {
      // With perPage=3, page 2 should show different articles
      const html = await $fetch("/clanky?stranka=1")

      expect(html).toContain("Články")
    })
  })

  // --- News detail API ---

  describe("GET /api/news/[id]", () => {
    it("returns a single news item by ID", async () => {
      // First get the list to find a valid ID
      const list = await $fetch("/api/news")
      const firstItem = list.items[0]

      const newsItem = await $fetch(`/api/news/${firstItem.id}`)

      expect(newsItem.id).toBe(firstItem.id)
      expect(newsItem.title).toBe(firstItem.title)
      expect(newsItem.content).toBe(firstItem.content)
      expect(newsItem.author).toBe(firstItem.author)
      expect(newsItem.datetime).toBe(firstItem.datetime)
    })

    it("returns 404 for non-existent ID", async () => {
      await expect($fetch("/api/news/99999")).rejects.toMatchObject({
        statusCode: 404,
      })
    })

    it("returns 400 for invalid ID", async () => {
      await expect($fetch("/api/news/abc")).rejects.toMatchObject({
        statusCode: 400,
      })
    })
  })

  // --- Error page ---

  describe("Error page", () => {
    it("renders 404 error page for non-existent route", async () => {
      const html = await $fetch("/neexistujici-stranka-xyz123", {
        headers: { accept: "text/html" },
        ignoreResponseError: true,
      })

      expect(html).toContain("Stránka nenalezena")
    })
  })

  // --- SEO meta tags ---

  describe("SEO meta tags", () => {
    it("renders site name in homepage title", async () => {
      const html = await $fetch("/")

      expect(html).toContain("24. oddíl Junáka Hradec Králové")
    })

    it("renders site description from settings in homepage meta", async () => {
      const html = await $fetch("/")

      expect(html).toContain("Skautský oddíl")
    })

    it("renders page-specific title on novinky", async () => {
      const html = await $fetch("/novinky")

      expect(html).toContain("Novinky — Čtyřiadvacítka")
    })

    it("renders page-specific title on clanky", async () => {
      const html = await $fetch("/clanky")

      expect(html).toContain("Články — Čtyřiadvacítka")
    })

    it("renders page-specific title on kontakt", async () => {
      const html = await $fetch("/kontakt")

      expect(html).toContain("Kontakt — Čtyřiadvacítka")
    })

    it("renders page-specific title on terminy", async () => {
      const html = await $fetch("/terminy")

      expect(html).toContain("Termíny akcí — Čtyřiadvacítka")
    })

    it("renders article title in article detail page", async () => {
      const html = await $fetch("/o-nas")

      expect(html).toContain("O nás — Čtyřiadvacítka")
    })

  })

  // --- Events page ---

  describe("Events page", () => {
    it("renders events page with heading", async () => {
      const html = await $fetch("/terminy")

      expect(html).toContain("Termíny akcí")
    })

    it("renders Google Calendar iframe with correct calendar ID", async () => {
      const html = await $fetch("/terminy")

      expect(html).toContain("calendar.google.com/calendar/embed")
      expect(html).toContain(
        encodeURIComponent("example@group.calendar.google.com"),
      )
    })

    it("renders iframe with accessible title", async () => {
      const html = await $fetch("/terminy")

      expect(html).toContain('title="Kalendář akcí oddílu"')
    })
  })
})
