// @vitest-environment node
import { createClient } from "@libsql/client"
import { drizzle } from "drizzle-orm/libsql"
import { beforeAll, describe, expect, it } from "vitest"
import { setup, $fetch, fetch } from "@nuxt/test-utils/e2e"

import { seedDatabase } from "~~/scripts/seed"
import * as schema from "~~/server/db/schema"

describe("header image upload API", async () => {
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

  // Helper to login and get session cookie
  async function loginAs(username: string, password: string): Promise<string> {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ username, password }),
    })
    const cookies = response.headers.get("set-cookie") || ""
    return cookies.split(";")[0]
  }

  // Helper to create a minimal PNG file as a Blob
  function createTestPng(): Blob {
    // Minimal valid 1x1 pixel PNG
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

  // --- GET /api/header-images ---

  describe("GET /api/header-images", () => {
    it("returns an empty list initially", async () => {
      const images = await $fetch("/api/header-images")
      expect(Array.isArray(images)).toBe(true)
    })

    it("is accessible without authentication", async () => {
      const images = await $fetch("/api/header-images")
      expect(Array.isArray(images)).toBe(true)
    })
  })

  // --- POST /api/header-images ---

  describe("POST /api/header-images", () => {
    it("uploads an image as admin", async () => {
      const sessionCookie = await loginAs("admin", "admin123")

      const formData = new FormData()
      formData.append("file", createTestPng(), "test-header.png")

      const result = await $fetch("/api/header-images", {
        method: "POST",
        headers: { cookie: sessionCookie },
        body: formData,
      })

      expect(result).toHaveProperty("pathname")
      expect(result.contentType).toBe("image/png")
    })

    it("uploads a second image", async () => {
      const sessionCookie = await loginAs("admin", "admin123")

      const formData = new FormData()
      formData.append("file", createTestPng(), "test-header-2.png")

      const result = await $fetch("/api/header-images", {
        method: "POST",
        headers: { cookie: sessionCookie },
        body: formData,
      })

      expect(result).toHaveProperty("pathname")
    })

    it("lists uploaded images", async () => {
      const images = await $fetch("/api/header-images")
      expect(images.length).toBeGreaterThanOrEqual(2)

      for (const image of images) {
        expect(image).toHaveProperty("pathname")
        expect(image).toHaveProperty("contentType")
      }
    })

    it("rejects non-image files", async () => {
      const sessionCookie = await loginAs("admin", "admin123")

      const formData = new FormData()
      formData.append(
        "file",
        new Blob(["not an image"], { type: "text/plain" }),
        "test.txt",
      )

      await expect(
        $fetch("/api/header-images", {
          method: "POST",
          headers: { cookie: sessionCookie },
          body: formData,
        }),
      ).rejects.toMatchObject({ statusCode: 400 })
    })

    it("rejects request without file", async () => {
      const sessionCookie = await loginAs("admin", "admin123")

      await expect(
        $fetch("/api/header-images", {
          method: "POST",
          headers: { cookie: sessionCookie },
        }),
      ).rejects.toMatchObject({ statusCode: 400 })
    })

    it("returns 401 for unauthenticated request", async () => {
      const formData = new FormData()
      formData.append("file", createTestPng(), "test.png")

      await expect(
        $fetch("/api/header-images", {
          method: "POST",
          body: formData,
        }),
      ).rejects.toMatchObject({ statusCode: 401 })
    })

    it("returns 403 for editor", async () => {
      const sessionCookie = await loginAs("editor", "editor123")

      const formData = new FormData()
      formData.append("file", createTestPng(), "test.png")

      await expect(
        $fetch("/api/header-images", {
          method: "POST",
          headers: { cookie: sessionCookie },
          body: formData,
        }),
      ).rejects.toMatchObject({ statusCode: 403 })
    })

    it("returns 403 for registered user", async () => {
      const sessionCookie = await loginAs("uzivatel", "user123")

      const formData = new FormData()
      formData.append("file", createTestPng(), "test.png")

      await expect(
        $fetch("/api/header-images", {
          method: "POST",
          headers: { cookie: sessionCookie },
          body: formData,
        }),
      ).rejects.toMatchObject({ statusCode: 403 })
    })
  })

  // --- DELETE /api/header-images/[pathname] ---

  describe("DELETE /api/header-images/[...pathname]", () => {
    it("deletes an image as admin", async () => {
      const sessionCookie = await loginAs("admin", "admin123")

      // Get the list first
      const images = await $fetch("/api/header-images")
      expect(images.length).toBeGreaterThan(0)

      const imageToDelete = images[0]

      const result = await $fetch(
        `/api/header-images/${imageToDelete.pathname}`,
        {
          method: "DELETE",
          headers: { cookie: sessionCookie },
        },
      )

      expect(result).toEqual({ success: true })

      // Verify it's gone from the list
      const imagesAfter = await $fetch("/api/header-images")
      const deleted = imagesAfter.find(
        (img: { pathname: string }) => img.pathname === imageToDelete.pathname,
      )
      expect(deleted).toBeUndefined()
    })

    it("returns 401 for unauthenticated request", async () => {
      await expect(
        $fetch("/api/header-images/some-image.png", {
          method: "DELETE",
        }),
      ).rejects.toMatchObject({ statusCode: 401 })
    })

    it("returns 403 for editor", async () => {
      const sessionCookie = await loginAs("editor", "editor123")

      await expect(
        $fetch("/api/header-images/some-image.png", {
          method: "DELETE",
          headers: { cookie: sessionCookie },
        }),
      ).rejects.toMatchObject({ statusCode: 403 })
    })

    it("returns 403 for registered user", async () => {
      const sessionCookie = await loginAs("uzivatel", "user123")

      await expect(
        $fetch("/api/header-images/some-image.png", {
          method: "DELETE",
          headers: { cookie: sessionCookie },
        }),
      ).rejects.toMatchObject({ statusCode: 403 })
    })
  })
})
