import { createClient } from "@libsql/client"
import { count, desc, or, sql } from "drizzle-orm"
import { drizzle } from "drizzle-orm/libsql"
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest"

import * as schema from "~~/server/db/schema"

// Test the search filtering logic used by the API endpoints
// This tests the same query construction as server/api/articles/index.get.ts
// and server/api/news/index.get.ts

const client = createClient({ url: ":memory:" })
const db = drizzle(client, { schema })

function buildSearchClause(
  table: typeof schema.articles | typeof schema.news,
  search: string,
) {
  const trimmed = search.trim()
  if (!trimmed) {
    return undefined
  }
  return or(
    sql`lower(${table.title}) like ${`%${trimmed.toLowerCase()}%`}`,
    sql`lower(${table.content}) like ${`%${trimmed.toLowerCase()}%`}`,
  )
}

beforeAll(() => {
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
  `)
})

afterAll(() => {
  client.close()
})

beforeEach(async () => {
  await client.executeMultiple(`
    DELETE FROM articles;
    DELETE FROM news;
  `)
})

describe("article search", () => {
  beforeEach(async () => {
    await db.insert(schema.articles).values([
      {
        title: "Úvod",
        url: "uvod",
        content: "<p>Vítejte na stránkách oddílu.</p>",
        author: "admin",
        datetime: "2026-01-01T10:00:00.000Z",
      },
      {
        title: "O nás",
        url: "o-nas",
        content: "<p>Scházíme se a pořádáme výpravy do přírody.</p>",
        author: "admin",
        datetime: "2026-01-05T10:00:00.000Z",
      },
      {
        title: "Letní tábor 2026",
        url: "letni-tabor-2026",
        content: "<p>Tábor se koná na Vysočině.</p>",
        author: "editor",
        datetime: "2026-02-15T10:00:00.000Z",
      },
      {
        title: "Historie oddílu",
        url: "historie",
        content: "<p>Oddíl byl založen v roce 1990.</p>",
        author: "admin",
        datetime: "2026-02-01T10:00:00.000Z",
      },
    ])
  })

  it("returns all articles when no search query", async () => {
    const whereClause = buildSearchClause(schema.articles, "")
    const items = await db
      .select()
      .from(schema.articles)
      .where(whereClause)
      .orderBy(desc(schema.articles.datetime))

    expect(items).toHaveLength(4)
  })

  it("filters articles by title match", async () => {
    const whereClause = buildSearchClause(schema.articles, "tábor")
    const items = await db
      .select()
      .from(schema.articles)
      .where(whereClause)
      .orderBy(desc(schema.articles.datetime))

    expect(items).toHaveLength(1)
    expect(items[0].title).toBe("Letní tábor 2026")
  })

  it("filters articles case-insensitively", async () => {
    const whereClause = buildSearchClause(schema.articles, "TÁBOR")
    const items = await db
      .select()
      .from(schema.articles)
      .where(whereClause)
      .orderBy(desc(schema.articles.datetime))

    expect(items).toHaveLength(1)
    expect(items[0].title).toBe("Letní tábor 2026")
  })

  it("searches in article content too", async () => {
    const whereClause = buildSearchClause(schema.articles, "přírody")
    const items = await db
      .select()
      .from(schema.articles)
      .where(whereClause)
      .orderBy(desc(schema.articles.datetime))

    expect(items).toHaveLength(1)
    expect(items[0].url).toBe("o-nas")
  })

  it("returns empty list for non-matching search", async () => {
    const whereClause = buildSearchClause(schema.articles, "neexistujícívýraz")
    const items = await db
      .select()
      .from(schema.articles)
      .where(whereClause)
      .orderBy(desc(schema.articles.datetime))

    expect(items).toHaveLength(0)
  })

  it("matches partial words", async () => {
    const whereClause = buildSearchClause(schema.articles, "oddíl")
    const items = await db
      .select()
      .from(schema.articles)
      .where(whereClause)
      .orderBy(desc(schema.articles.datetime))

    // "Historie oddílu" (title) and "Vítejte na stránkách oddílu" (content)
    expect(items).toHaveLength(2)
  })

  it("combines search with pagination (limit/offset)", async () => {
    const whereClause = buildSearchClause(schema.articles, "oddíl")
    const [items, [{ totalCount }]] = await Promise.all([
      db
        .select()
        .from(schema.articles)
        .where(whereClause)
        .orderBy(desc(schema.articles.datetime))
        .limit(1)
        .offset(0),
      db
        .select({ totalCount: count() })
        .from(schema.articles)
        .where(whereClause),
    ])

    expect(items).toHaveLength(1)
    expect(totalCount).toBe(2)
  })

  it("ignores whitespace-only search string", async () => {
    const whereClause = buildSearchClause(schema.articles, "   ")
    const items = await db
      .select()
      .from(schema.articles)
      .where(whereClause)
      .orderBy(desc(schema.articles.datetime))

    expect(items).toHaveLength(4)
  })
})

describe("news search", () => {
  beforeEach(async () => {
    await db.insert(schema.news).values([
      {
        title: "Zahájení nového roku",
        content: "<p>Sraz bude v klubovně v 16:00.</p>",
        author: "admin",
        datetime: "2026-01-07T16:00:00.000Z",
      },
      {
        title: "Výprava do Krkonoš",
        content: "<p>Sraz v 8:00 na nádraží.</p>",
        author: "editor",
        datetime: "2026-01-14T08:00:00.000Z",
      },
      {
        title: "Karneval",
        content: "<p>Přijďte v maskách!</p>",
        author: "editor",
        datetime: "2026-02-04T16:00:00.000Z",
      },
      {
        title: "Schůzka odpadá",
        content: "<p>Z důvodu prázdnin schůzka odpadá.</p>",
        author: "editor",
        datetime: "2026-01-28T10:00:00.000Z",
      },
      {
        title: "Schůzka s rodiči",
        content: "<p>Informační schůzka o letním táboře.</p>",
        author: "admin",
        datetime: "2026-03-04T18:00:00.000Z",
      },
    ])
  })

  it("returns all news when no search query", async () => {
    const whereClause = buildSearchClause(schema.news, "")
    const items = await db
      .select()
      .from(schema.news)
      .where(whereClause)
      .orderBy(desc(schema.news.datetime))

    expect(items).toHaveLength(5)
  })

  it("filters news by title match", async () => {
    const whereClause = buildSearchClause(schema.news, "Karneval")
    const items = await db
      .select()
      .from(schema.news)
      .where(whereClause)
      .orderBy(desc(schema.news.datetime))

    expect(items).toHaveLength(1)
    expect(items[0].title).toBe("Karneval")
  })

  it("filters news case-insensitively", async () => {
    const whereClause = buildSearchClause(schema.news, "karneval")
    const items = await db
      .select()
      .from(schema.news)
      .where(whereClause)
      .orderBy(desc(schema.news.datetime))

    expect(items).toHaveLength(1)
    expect(items[0].title).toBe("Karneval")
  })

  it("searches in news content too", async () => {
    const whereClause = buildSearchClause(schema.news, "nádraží")
    const items = await db
      .select()
      .from(schema.news)
      .where(whereClause)
      .orderBy(desc(schema.news.datetime))

    expect(items).toHaveLength(1)
    expect(items[0].title).toBe("Výprava do Krkonoš")
  })

  it("returns empty list for non-matching search", async () => {
    const whereClause = buildSearchClause(schema.news, "neexistujícívýraz")
    const items = await db
      .select()
      .from(schema.news)
      .where(whereClause)
      .orderBy(desc(schema.news.datetime))

    expect(items).toHaveLength(0)
  })

  it("finds multiple results with shared search term", async () => {
    const whereClause = buildSearchClause(schema.news, "schůzk")
    const items = await db
      .select()
      .from(schema.news)
      .where(whereClause)
      .orderBy(desc(schema.news.datetime))

    // "Schůzka odpadá" (title+content) and "Schůzka s rodiči" (title+content)
    expect(items).toHaveLength(2)
    const titles = items.map((i) => i.title)
    expect(titles).toContain("Schůzka odpadá")
    expect(titles).toContain("Schůzka s rodiči")
  })

  it("combines search with pagination", async () => {
    const whereClause = buildSearchClause(schema.news, "schůzk")
    const [items, [{ totalCount }]] = await Promise.all([
      db
        .select()
        .from(schema.news)
        .where(whereClause)
        .orderBy(desc(schema.news.datetime))
        .limit(1)
        .offset(0),
      db.select({ totalCount: count() }).from(schema.news).where(whereClause),
    ])

    expect(items).toHaveLength(1)
    expect(totalCount).toBe(2)
  })
})
