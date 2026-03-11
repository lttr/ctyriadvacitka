import { createClient } from "@libsql/client"
import { desc, eq } from "drizzle-orm"
import { drizzle } from "drizzle-orm/libsql"
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest"

import * as schema from "~~/server/db/schema"

const client = createClient({ url: ":memory:" })
const db = drizzle(client, { schema })

beforeAll(() => {
  // Create tables manually for in-memory database
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
})

afterAll(() => {
  client.close()
})

beforeEach(async () => {
  await client.executeMultiple(`
    DELETE FROM articles;
    DELETE FROM news;
    DELETE FROM users;
    DELETE FROM site_settings;
  `)
})

describe("articles CRUD", () => {
  it("inserts and selects an article", async () => {
    await db.insert(schema.articles).values({
      title: "Úvod",
      url: "uvod",
      content: "<p>Vítejte</p>",
      author: "admin",
      datetime: "2026-03-04T10:00:00.000Z",
    })

    const results = await db.select().from(schema.articles)
    expect(results).toHaveLength(1)
    expect(results[0].title).toBe("Úvod")
    expect(results[0].url).toBe("uvod")
    expect(results[0].requestable).toBe(true)
    expect(results[0].inMenu).toBe(false)
  })

  it("enforces unique url constraint", async () => {
    await db.insert(schema.articles).values({ title: "First", url: "same-url" })

    await expect(
      db.insert(schema.articles).values({ title: "Second", url: "same-url" }),
    ).rejects.toThrow()
  })

  it("updates an article", async () => {
    await db.insert(schema.articles).values({ title: "Original", url: "test" })

    await db
      .update(schema.articles)
      .set({ title: "Updated", inMenu: true })
      .where(eq(schema.articles.url, "test"))

    const result = await db
      .select()
      .from(schema.articles)
      .where(eq(schema.articles.url, "test"))
      .then((r) => r[0])
    expect(result?.title).toBe("Updated")
    expect(result?.inMenu).toBe(true)
  })

  it("deletes an article", async () => {
    await db
      .insert(schema.articles)
      .values({ title: "To Delete", url: "delete-me" })

    await db.delete(schema.articles).where(eq(schema.articles.url, "delete-me"))

    const results = await db.select().from(schema.articles)
    expect(results).toHaveLength(0)
  })

  it("defaults requestable to true and inMenu to false", async () => {
    await db
      .insert(schema.articles)
      .values({ title: "Defaults", url: "defaults" })

    const result = await db
      .select()
      .from(schema.articles)
      .where(eq(schema.articles.url, "defaults"))
      .then((r) => r[0])
    expect(result?.requestable).toBe(true)
    expect(result?.inMenu).toBe(false)
  })
})

describe("news CRUD", () => {
  it("inserts and selects news", async () => {
    await db.insert(schema.news).values({
      title: "Nová novinka",
      content: "<p>Obsah</p>",
      author: "editor",
      datetime: "2026-03-04T10:00:00.000Z",
    })

    const results = await db.select().from(schema.news)
    expect(results).toHaveLength(1)
    expect(results[0].title).toBe("Nová novinka")
  })

  it("updates news", async () => {
    await db.insert(schema.news).values({ title: "Original" })

    const [inserted] = await db.select().from(schema.news)
    await db
      .update(schema.news)
      .set({ title: "Updated" })
      .where(eq(schema.news.id, inserted.id))

    const [result] = await db
      .select()
      .from(schema.news)
      .where(eq(schema.news.id, inserted.id))
    expect(result?.title).toBe("Updated")
  })

  it("deletes news", async () => {
    await db.insert(schema.news).values({ title: "To Delete" })
    const [inserted] = await db.select().from(schema.news)

    await db.delete(schema.news).where(eq(schema.news.id, inserted.id))

    const results = await db.select().from(schema.news)
    expect(results).toHaveLength(0)
  })
})

describe("users CRUD", () => {
  it("inserts and selects a user", async () => {
    await db.insert(schema.users).values({
      username: "admin",
      password: "$2b$10$hash",
      name: "Jan",
      surname: "Novák",
      role: "admin",
    })

    const results = await db.select().from(schema.users)
    expect(results).toHaveLength(1)
    expect(results[0].username).toBe("admin")
    expect(results[0].role).toBe("admin")
  })

  it("enforces unique username constraint", async () => {
    await db
      .insert(schema.users)
      .values({ username: "unique", password: "hash" })

    await expect(
      db.insert(schema.users).values({ username: "unique", password: "hash2" }),
    ).rejects.toThrow()
  })

  it("enforces unique email constraint", async () => {
    await db.insert(schema.users).values({
      username: "user1",
      password: "hash",
      email: "same@example.com",
    })

    await expect(
      db.insert(schema.users).values({
        username: "user2",
        password: "hash",
        email: "same@example.com",
      }),
    ).rejects.toThrow()
  })

  it("defaults role to registered", async () => {
    await db
      .insert(schema.users)
      .values({ username: "newuser", password: "hash" })

    const [result] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.username, "newuser"))
    expect(result?.role).toBe("registered")
  })

  it("updates a user", async () => {
    await db
      .insert(schema.users)
      .values({ username: "updatable", password: "hash" })

    await db
      .update(schema.users)
      .set({ role: "editor", nickname: "Nový" })
      .where(eq(schema.users.username, "updatable"))

    const [result] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.username, "updatable"))
    expect(result?.role).toBe("editor")
    expect(result?.nickname).toBe("Nový")
  })

  it("deletes a user", async () => {
    await db
      .insert(schema.users)
      .values({ username: "deleteme", password: "hash" })

    await db.delete(schema.users).where(eq(schema.users.username, "deleteme"))

    const results = await db.select().from(schema.users)
    expect(results).toHaveLength(0)
  })
})

describe("site settings CRUD", () => {
  it("inserts and selects a setting", async () => {
    await db
      .insert(schema.siteSettings)
      .values({ key: "webName", value: "Čtyřiadvacítka" })

    const [result] = await db
      .select()
      .from(schema.siteSettings)
      .where(eq(schema.siteSettings.key, "webName"))
    expect(result?.value).toBe("Čtyřiadvacítka")
  })

  it("updates a setting value", async () => {
    await db
      .insert(schema.siteSettings)
      .values({ key: "webDescription", value: "Old" })

    await db
      .update(schema.siteSettings)
      .set({ value: "New" })
      .where(eq(schema.siteSettings.key, "webDescription"))

    const [result] = await db
      .select()
      .from(schema.siteSettings)
      .where(eq(schema.siteSettings.key, "webDescription"))
    expect(result?.value).toBe("New")
  })

  it("deletes a setting", async () => {
    await db
      .insert(schema.siteSettings)
      .values({ key: "toDelete", value: "val" })

    await db
      .delete(schema.siteSettings)
      .where(eq(schema.siteSettings.key, "toDelete"))

    const results = await db
      .select()
      .from(schema.siteSettings)
      .where(eq(schema.siteSettings.key, "toDelete"))
    expect(results).toHaveLength(0)
  })

  it("enforces unique key constraint (primary key)", async () => {
    await db
      .insert(schema.siteSettings)
      .values({ key: "unique", value: "first" })

    await expect(
      db.insert(schema.siteSettings).values({ key: "unique", value: "second" }),
    ).rejects.toThrow()
  })
})

describe("ordering", () => {
  it("selects articles ordered by datetime DESC", async () => {
    await db.insert(schema.articles).values([
      { title: "Starý", url: "stary", datetime: "2026-01-01T10:00:00.000Z" },
      { title: "Nový", url: "novy", datetime: "2026-03-01T10:00:00.000Z" },
      {
        title: "Střední",
        url: "stredni",
        datetime: "2026-02-01T10:00:00.000Z",
      },
    ])

    const results = await db
      .select()
      .from(schema.articles)
      .orderBy(desc(schema.articles.datetime))

    expect(results.map((r) => r.title)).toEqual(["Nový", "Střední", "Starý"])
  })

  it("selects news ordered by datetime DESC", async () => {
    await db.insert(schema.news).values([
      { title: "Leden", datetime: "2026-01-15T10:00:00.000Z" },
      { title: "Březen", datetime: "2026-03-15T10:00:00.000Z" },
      { title: "Únor", datetime: "2026-02-15T10:00:00.000Z" },
    ])

    const results = await db
      .select()
      .from(schema.news)
      .orderBy(desc(schema.news.datetime))

    expect(results.map((r) => r.title)).toEqual(["Březen", "Únor", "Leden"])
  })
})
