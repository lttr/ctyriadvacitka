import { createClient } from "@libsql/client"
import { count } from "drizzle-orm"
import { drizzle } from "drizzle-orm/libsql"
import { afterAll, beforeAll, describe, expect, it } from "vitest"

import { seedDatabase } from "~~/scripts/seed"
import * as schema from "~~/server/db/schema"

const client = createClient({ url: ":memory:" })
const db = drizzle(client, { schema })

beforeAll(async () => {
  client.executeMultiple(`
    CREATE TABLE articles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      url TEXT NOT NULL UNIQUE,
      content TEXT,
      requestable INTEGER NOT NULL DEFAULT 0,
      in_menu INTEGER NOT NULL DEFAULT 0,
      author TEXT,
      datetime TEXT
    );

    CREATE TABLE news (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT,
      author TEXT,
      datetime TEXT
    );

    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      name TEXT,
      surname TEXT,
      nickname TEXT,
      email TEXT UNIQUE,
      role TEXT NOT NULL DEFAULT 'registered'
    );

    CREATE TABLE site_settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `)

  await seedDatabase(db)
})

afterAll(() => {
  client.close()
})

describe("seed data — users", () => {
  it("creates 3 users", async () => {
    const [result] = await db.select({ total: count() }).from(schema.users)
    expect(result.total).toBe(3)
  })

  it("creates admin, editor, and registered users", async () => {
    const users = await db.select().from(schema.users)
    const roles = users.map((u) => u.role).sort()
    expect(roles).toEqual(["admin", "editor", "registered"])
  })

  it("stores hashed passwords (not plaintext)", async () => {
    const users = await db.select().from(schema.users)
    for (const user of users) {
      expect(user.password).toMatch(/^\$2[aby]\$/)
    }
  })

  it("populates name and email for all users", async () => {
    const users = await db.select().from(schema.users)
    for (const user of users) {
      expect(user.name).toBeTruthy()
      expect(user.email).toBeTruthy()
    }
  })
})

describe("seed data — articles", () => {
  it("creates at least 5 articles", async () => {
    const [result] = await db.select({ total: count() }).from(schema.articles)
    expect(result.total).toBeGreaterThanOrEqual(5)
  })

  it("has at least one article with inMenu true", async () => {
    const articles = await db.select().from(schema.articles)
    expect(articles.some((a) => a.inMenu === true)).toBe(true)
  })

  it("has at least one requestable article", async () => {
    const articles = await db.select().from(schema.articles)
    expect(articles.some((a) => a.requestable === true)).toBe(true)
  })

  it("all articles have author and datetime", async () => {
    const articles = await db.select().from(schema.articles)
    for (const article of articles) {
      expect(article.author).toBeTruthy()
      expect(article.datetime).toBeTruthy()
    }
  })
})

describe("seed data — news", () => {
  it("creates at least 10 news items", async () => {
    const [result] = await db.select({ total: count() }).from(schema.news)
    expect(result.total).toBeGreaterThanOrEqual(10)
  })

  it("all news have author and datetime", async () => {
    const news = await db.select().from(schema.news)
    for (const item of news) {
      expect(item.author).toBeTruthy()
      expect(item.datetime).toBeTruthy()
    }
  })

  it("news have varying dates", async () => {
    const news = await db.select().from(schema.news)
    const uniqueDates = new Set(news.map((n) => n.datetime!.substring(0, 10)))
    expect(uniqueDates.size).toBeGreaterThanOrEqual(5)
  })
})

describe("seed data — site settings", () => {
  it("creates required site settings", async () => {
    const settings = await db.select().from(schema.siteSettings)
    const keys = settings.map((s) => s.key)

    expect(keys).toContain("siteName")
    expect(keys).toContain("contactEmail")
    expect(keys).toContain("contactPhone")
    expect(keys).toContain("contactAddress")
    expect(keys).toContain("introArticleId")
  })

  it("siteName is set to a non-empty value", async () => {
    const settings = await db.select().from(schema.siteSettings)
    const siteName = settings.find((s) => s.key === "siteName")
    expect(siteName?.value).toBeTruthy()
  })
})
