import { describe, expect, it } from "vitest"
import type { z } from "zod"

import {
  insertArticleSchema,
  insertNewsSchema,
  insertSiteSettingSchema,
  insertUserSchema,
  selectArticleSchema,
  selectNewsSchema,
  selectSiteSettingSchema,
  selectUserSchema,
} from "~~/shared/types/validation"

describe("article schema validation", () => {
  it("accepts valid article data", () => {
    const result = insertArticleSchema.safeParse({
      title: "Úvod",
      url: "uvod",
      content: "<p>Vítejte na stránkách</p>",
      requestable: true,
      inMenu: true,
      author: "admin",
      datetime: "2026-03-04T10:00:00.000Z",
    })
    expect(result.success).toBe(true)
  })

  it("requires title", () => {
    const result = insertArticleSchema.safeParse({
      url: "test",
    })
    expect(result.success).toBe(false)
  })

  it("requires url", () => {
    const result = insertArticleSchema.safeParse({
      title: "Test",
    })
    expect(result.success).toBe(false)
  })

  it("accepts minimal article with only title and url", () => {
    const result = insertArticleSchema.safeParse({
      title: "Minimum",
      url: "minimum",
    })
    expect(result.success).toBe(true)
  })

  it("rejects non-string title", () => {
    const result = insertArticleSchema.safeParse({
      title: 123,
      url: "test",
    })
    expect(result.success).toBe(false)
  })

  it("select schema includes id", () => {
    const result = selectArticleSchema.safeParse({
      id: 1,
      title: "Test",
      url: "test",
      content: null,
      requestable: false,
      inMenu: false,
      author: null,
      datetime: null,
    })
    expect(result.success).toBe(true)
  })
})

describe("news schema validation", () => {
  it("accepts valid news data", () => {
    const result = insertNewsSchema.safeParse({
      title: "Nová novinka",
      content: "<p>Obsah novinky</p>",
      author: "editor",
      datetime: "2026-03-04T10:00:00.000Z",
    })
    expect(result.success).toBe(true)
  })

  it("requires title", () => {
    const result = insertNewsSchema.safeParse({
      content: "Some content",
    })
    expect(result.success).toBe(false)
  })

  it("accepts minimal news with only title", () => {
    const result = insertNewsSchema.safeParse({
      title: "Krátká novinka",
    })
    expect(result.success).toBe(true)
  })

  it("select schema includes id", () => {
    const result = selectNewsSchema.safeParse({
      id: 1,
      title: "Test",
      content: null,
      author: null,
      datetime: null,
    })
    expect(result.success).toBe(true)
  })
})

describe("user schema validation", () => {
  it("accepts valid user data", () => {
    const result = insertUserSchema.safeParse({
      username: "admin",
      password: "$2b$10$hashedpassword",
      name: "Jan",
      surname: "Novák",
      nickname: "Honza",
      email: "jan@example.com",
      role: "admin",
    })
    expect(result.success).toBe(true)
  })

  it("requires username", () => {
    const result = insertUserSchema.safeParse({
      password: "hash",
    })
    expect(result.success).toBe(false)
  })

  it("requires password", () => {
    const result = insertUserSchema.safeParse({
      username: "test",
    })
    expect(result.success).toBe(false)
  })

  it("accepts minimal user with only username and password", () => {
    const result = insertUserSchema.safeParse({
      username: "test",
      password: "hash",
    })
    expect(result.success).toBe(true)
  })

  it("select schema includes default role", () => {
    const result = selectUserSchema.safeParse({
      id: 1,
      username: "test",
      password: "hash",
      name: null,
      surname: null,
      nickname: null,
      email: null,
      role: "registered",
    })
    expect(result.success).toBe(true)
  })
})

describe("site settings schema validation", () => {
  it("accepts valid setting data", () => {
    const result = insertSiteSettingSchema.safeParse({
      key: "webName",
      value: "Čtyřiadvacítka",
    })
    expect(result.success).toBe(true)
  })

  it("requires key", () => {
    const result = insertSiteSettingSchema.safeParse({
      value: "some value",
    })
    expect(result.success).toBe(false)
  })

  it("accepts setting with null value", () => {
    const result = insertSiteSettingSchema.safeParse({
      key: "emptyKey",
      value: null,
    })
    expect(result.success).toBe(true)
  })

  it("select schema works correctly", () => {
    const result = selectSiteSettingSchema.safeParse({
      key: "webName",
      value: "Čtyřiadvacítka",
    })
    expect(result.success).toBe(true)
  })
})

describe("type inference", () => {
  it("insert article schema produces correct shape", () => {
    type InsertArticle = z.infer<typeof insertArticleSchema>

    const article: InsertArticle = {
      title: "Test",
      url: "test",
    }
    expect(article.title).toBe("Test")
    expect(article.url).toBe("test")
  })

  it("insert user schema produces correct shape", () => {
    type InsertUser = z.infer<typeof insertUserSchema>

    const user: InsertUser = {
      username: "test",
      password: "hash",
    }
    expect(user.username).toBe("test")
    expect(user.password).toBe("hash")
  })
})
