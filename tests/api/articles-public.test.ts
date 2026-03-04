import { createClient } from "@libsql/client"
import { desc, eq } from "drizzle-orm"
import { drizzle } from "drizzle-orm/libsql"
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest"

import * as schema from "~~/server/db/schema"

const client = createClient({ url: ":memory:" })
const db = drizzle(client, { schema })

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
  `)
})

afterAll(() => {
  client.close()
})

beforeEach(async () => {
  await client.executeMultiple(`DELETE FROM articles;`)
})

describe("GET /api/articles/menu — query logic", () => {
  it("returns only articles with inMenu=true", async () => {
    await db.insert(schema.articles).values([
      { title: "Úvod", url: "uvod", inMenu: true },
      { title: "O nás", url: "o-nas", inMenu: true },
      { title: "Historie", url: "historie", inMenu: false },
    ])

    const results = await db
      .select()
      .from(schema.articles)
      .where(eq(schema.articles.inMenu, true))

    expect(results).toHaveLength(2)
    expect(results.every((a) => a.inMenu === true)).toBe(true)
  })

  it("returns articles ordered by title", async () => {
    await db.insert(schema.articles).values([
      { title: "Vedení oddílu", url: "vedeni", inMenu: true },
      { title: "O nás", url: "o-nas", inMenu: true },
      { title: "Úvod", url: "uvod", inMenu: true },
    ])

    const results = await db
      .select()
      .from(schema.articles)
      .where(eq(schema.articles.inMenu, true))
      .orderBy(schema.articles.title)

    expect(results.map((a) => a.title)).toEqual([
      "O nás",
      "Vedení oddílu",
      "Úvod",
    ])
  })

  it("returns empty array when no articles have inMenu=true", async () => {
    await db
      .insert(schema.articles)
      .values([{ title: "Hidden", url: "hidden", inMenu: false }])

    const results = await db
      .select()
      .from(schema.articles)
      .where(eq(schema.articles.inMenu, true))

    expect(results).toHaveLength(0)
  })

  it("returns id, title, and url for each menu article", async () => {
    await db.insert(schema.articles).values([
      {
        title: "O nás",
        url: "o-nas",
        content: "<p>Content</p>",
        inMenu: true,
        author: "admin",
        datetime: "2026-01-01T00:00:00.000Z",
      },
    ])

    const results = await db
      .select({
        id: schema.articles.id,
        title: schema.articles.title,
        url: schema.articles.url,
      })
      .from(schema.articles)
      .where(eq(schema.articles.inMenu, true))
      .orderBy(schema.articles.title)

    expect(results).toHaveLength(1)
    expect(results[0]).toEqual({
      id: expect.any(Number),
      title: "O nás",
      url: "o-nas",
    })
  })
})

describe("GET /api/articles/[url] — query logic", () => {
  it("returns a single article by url slug", async () => {
    await db.insert(schema.articles).values({
      title: "O nás",
      url: "o-nas",
      content: "<p>Jsme skautský oddíl.</p>",
      author: "admin",
      datetime: "2026-01-05T10:00:00.000Z",
    })

    const [result] = await db
      .select()
      .from(schema.articles)
      .where(eq(schema.articles.url, "o-nas"))

    expect(result).toBeDefined()
    expect(result.title).toBe("O nás")
    expect(result.content).toBe("<p>Jsme skautský oddíl.</p>")
  })

  it("returns undefined for non-existent slug", async () => {
    const [result] = await db
      .select()
      .from(schema.articles)
      .where(eq(schema.articles.url, "non-existent"))

    expect(result).toBeUndefined()
  })
})

describe("GET /api/articles — list query logic", () => {
  it("returns all articles ordered by datetime DESC", async () => {
    await db.insert(schema.articles).values([
      { title: "Starý", url: "stary", datetime: "2026-01-01T00:00:00.000Z" },
      { title: "Nový", url: "novy", datetime: "2026-03-01T00:00:00.000Z" },
      {
        title: "Střední",
        url: "stredni",
        datetime: "2026-02-01T00:00:00.000Z",
      },
    ])

    const results = await db
      .select()
      .from(schema.articles)
      .orderBy(desc(schema.articles.datetime))

    expect(results.map((a) => a.title)).toEqual(["Nový", "Střední", "Starý"])
  })
})
