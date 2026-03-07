// @vitest-environment node
import { createClient } from "@libsql/client"
import { drizzle } from "drizzle-orm/libsql"
import { beforeAll, describe, expect, it } from "vitest"
import { setup, $fetch, fetch } from "@nuxt/test-utils/e2e"

import { seedDatabase } from "~~/scripts/seed"
import * as schema from "~~/server/db/schema"

describe("article image upload API", async () => {
  await setup({ server: true })

  // Cache session cookies to avoid hitting login rate limits
  const sessions: Record<string, string> = {}

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

    // Pre-login all users once to avoid rate limiting
    sessions.editor = await loginAs("editor", "editor123")
    sessions.admin = await loginAs("admin", "admin123")
    sessions.user = await loginAs("uzivatel", "user123")
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

  function createTestPng(): Blob {
    const pngBytes = new Uint8Array([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xde, 0x00, 0x00, 0x00,
      0x0c, 0x49, 0x44, 0x41, 0x54, 0x08, 0xd7, 0x63, 0xf8, 0xcf, 0xc0, 0x00,
      0x00, 0x00, 0x02, 0x00, 0x01, 0xe2, 0x21, 0xbc, 0x33, 0x00, 0x00, 0x00,
      0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
    ])
    return new Blob([pngBytes], { type: "image/png" })
  }

  // --- GET /api/article-images ---

  describe("GET /api/article-images", () => {
    it("returns a list when authenticated as editor", async () => {
      const images = await $fetch("/api/article-images", {
        headers: { cookie: sessions.editor },
      })
      expect(Array.isArray(images)).toBe(true)
    })

    it("returns 401 for unauthenticated request", async () => {
      await expect($fetch("/api/article-images")).rejects.toMatchObject({
        statusCode: 401,
      })
    })

    it("returns 403 for registered user", async () => {
      await expect(
        $fetch("/api/article-images", {
          headers: { cookie: sessions.user },
        }),
      ).rejects.toMatchObject({ statusCode: 403 })
    })
  })

  // --- POST /api/article-images ---

  describe("POST /api/article-images", () => {
    it("uploads an image as editor", async () => {
      const formData = new FormData()
      formData.append("file", createTestPng(), "article-img.png")

      const result = await $fetch("/api/article-images", {
        method: "POST",
        headers: { cookie: sessions.editor },
        body: formData,
      })

      expect(result).toHaveProperty("pathname")
      expect(result.contentType).toBe("image/png")
    })

    it("uploads an image as admin", async () => {
      const formData = new FormData()
      formData.append("file", createTestPng(), "article-img-2.png")

      const result = await $fetch("/api/article-images", {
        method: "POST",
        headers: { cookie: sessions.admin },
        body: formData,
      })

      expect(result).toHaveProperty("pathname")
    })

    it("lists uploaded images after upload", async () => {
      const images = await $fetch("/api/article-images", {
        headers: { cookie: sessions.editor },
      })
      expect(images.length).toBeGreaterThanOrEqual(2)

      for (const image of images) {
        expect(image).toHaveProperty("pathname")
        expect(image).toHaveProperty("contentType")
      }
    })

    it("rejects non-image files", async () => {
      const formData = new FormData()
      formData.append(
        "file",
        new Blob(["not an image"], { type: "text/plain" }),
        "test.txt",
      )

      await expect(
        $fetch("/api/article-images", {
          method: "POST",
          headers: { cookie: sessions.editor },
          body: formData,
        }),
      ).rejects.toMatchObject({ statusCode: 400 })
    })

    it("rejects request without file", async () => {
      await expect(
        $fetch("/api/article-images", {
          method: "POST",
          headers: { cookie: sessions.editor },
        }),
      ).rejects.toMatchObject({ statusCode: 400 })
    })

    it("returns 401 for unauthenticated request", async () => {
      const formData = new FormData()
      formData.append("file", createTestPng(), "test.png")

      await expect(
        $fetch("/api/article-images", {
          method: "POST",
          body: formData,
        }),
      ).rejects.toMatchObject({ statusCode: 401 })
    })

    it("returns 403 for registered user", async () => {
      const formData = new FormData()
      formData.append("file", createTestPng(), "test.png")

      await expect(
        $fetch("/api/article-images", {
          method: "POST",
          headers: { cookie: sessions.user },
          body: formData,
        }),
      ).rejects.toMatchObject({ statusCode: 403 })
    })
  })

  // --- DELETE /api/article-images/[...pathname] ---

  describe("DELETE /api/article-images/[...pathname]", () => {
    it("deletes an image as editor", async () => {
      const images = await $fetch("/api/article-images", {
        headers: { cookie: sessions.editor },
      })
      expect(images.length).toBeGreaterThan(0)

      const imageToDelete = images[0]

      const result = await $fetch(
        `/api/article-images/${imageToDelete.pathname}`,
        {
          method: "DELETE",
          headers: { cookie: sessions.editor },
        },
      )

      expect(result).toEqual({ success: true })

      const imagesAfter = await $fetch("/api/article-images", {
        headers: { cookie: sessions.editor },
      })
      const deleted = imagesAfter.find(
        (img: { pathname: string }) => img.pathname === imageToDelete.pathname,
      )
      expect(deleted).toBeUndefined()
    })

    it("deletes an image as admin", async () => {
      const formData = new FormData()
      formData.append("file", createTestPng(), "to-delete.png")
      const uploaded = await $fetch("/api/article-images", {
        method: "POST",
        headers: { cookie: sessions.admin },
        body: formData,
      })

      const result = await $fetch(`/api/article-images/${uploaded.pathname}`, {
        method: "DELETE",
        headers: { cookie: sessions.admin },
      })

      expect(result).toEqual({ success: true })
    })

    it("returns 401 for unauthenticated request", async () => {
      await expect(
        $fetch("/api/article-images/some-image.png", {
          method: "DELETE",
        }),
      ).rejects.toMatchObject({ statusCode: 401 })
    })

    it("returns 403 for registered user", async () => {
      await expect(
        $fetch("/api/article-images/some-image.png", {
          method: "DELETE",
          headers: { cookie: sessions.user },
        }),
      ).rejects.toMatchObject({ statusCode: 403 })
    })
  })
})
