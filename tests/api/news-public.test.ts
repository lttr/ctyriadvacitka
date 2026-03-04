import { createClient } from "@libsql/client"
import { desc } from "drizzle-orm"
import { drizzle } from "drizzle-orm/libsql"
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest"

import * as schema from "~~/server/db/schema"

const client = createClient({ url: ":memory:" })
const db = drizzle(client, { schema })

beforeAll(() => {
  client.executeMultiple(`
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
  await client.executeMultiple(`DELETE FROM news;`)
})

describe("GET /api/news/recent — query logic", () => {
  it("returns latest 5 news items ordered by datetime DESC", async () => {
    const newsItems = Array.from({ length: 8 }, (_, i) => ({
      title: `Novinka ${i + 1}`,
      content: `<p>Obsah ${i + 1}</p>`,
      author: "editor",
      datetime: `2026-0${Math.min(i + 1, 9)}-01T10:00:00.000Z`,
    }))

    await db.insert(schema.news).values(newsItems)

    const results = await db
      .select()
      .from(schema.news)
      .orderBy(desc(schema.news.datetime))
      .limit(5)

    expect(results).toHaveLength(5)
    // First result should be the most recent
    expect(results[0].title).toBe("Novinka 8")
  })

  it("returns all news when fewer than 5 exist", async () => {
    await db.insert(schema.news).values([
      {
        title: "Novinka 1",
        content: "<p>Obsah</p>",
        datetime: "2026-01-01T10:00:00.000Z",
      },
      {
        title: "Novinka 2",
        content: "<p>Obsah</p>",
        datetime: "2026-02-01T10:00:00.000Z",
      },
    ])

    const results = await db
      .select()
      .from(schema.news)
      .orderBy(desc(schema.news.datetime))
      .limit(5)

    expect(results).toHaveLength(2)
    expect(results[0].title).toBe("Novinka 2")
    expect(results[1].title).toBe("Novinka 1")
  })

  it("returns empty array when no news exist", async () => {
    const results = await db
      .select()
      .from(schema.news)
      .orderBy(desc(schema.news.datetime))
      .limit(5)

    expect(results).toHaveLength(0)
  })

  it("includes all news fields in response", async () => {
    await db.insert(schema.news).values({
      title: "Zahájení",
      content: "<p>Sraz v 16:00.</p>",
      author: "admin",
      datetime: "2026-01-07T16:00:00.000Z",
    })

    const results = await db
      .select()
      .from(schema.news)
      .orderBy(desc(schema.news.datetime))
      .limit(5)

    expect(results[0]).toEqual({
      id: expect.any(Number),
      title: "Zahájení",
      content: "<p>Sraz v 16:00.</p>",
      author: "admin",
      datetime: "2026-01-07T16:00:00.000Z",
    })
  })
})

describe("GET /api/news — paginated list query logic", () => {
  it("supports limit and offset for pagination", async () => {
    const newsItems = Array.from({ length: 15 }, (_, i) => ({
      title: `Novinka ${String(i + 1).padStart(2, "0")}`,
      datetime: `2026-01-${String(i + 1).padStart(2, "0")}T10:00:00.000Z`,
    }))

    await db.insert(schema.news).values(newsItems)

    const page1 = await db
      .select()
      .from(schema.news)
      .orderBy(desc(schema.news.datetime))
      .limit(5)
      .offset(0)

    const page2 = await db
      .select()
      .from(schema.news)
      .orderBy(desc(schema.news.datetime))
      .limit(5)
      .offset(5)

    expect(page1).toHaveLength(5)
    expect(page2).toHaveLength(5)
    // First page has the most recent, second page has older
    expect(page1[0].title).toBe("Novinka 15")
    expect(page2[0].title).toBe("Novinka 10")
    // No overlap between pages
    const page1Ids = page1.map((n) => n.id)
    const page2Ids = page2.map((n) => n.id)
    expect(page1Ids.filter((id) => page2Ids.includes(id))).toHaveLength(0)
  })
})
