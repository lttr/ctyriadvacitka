// @vitest-environment node
import { createClient } from "@libsql/client"
import { drizzle } from "drizzle-orm/libsql"
import { beforeAll, describe, expect, it } from "vitest"
import { setup, $fetch, fetch } from "@nuxt/test-utils/e2e"

import { seedDatabase } from "~~/scripts/seed"
import * as schema from "~~/server/db/schema"

describe("settings admin API", async () => {
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

  // --- PUT /api/settings ---

  describe("PUT /api/settings", () => {
    it("updates settings as admin", async () => {
      const sessionCookie = await loginAs("admin", "admin123")

      const result = await $fetch("/api/settings", {
        method: "PUT",
        headers: {
          cookie: sessionCookie,
          "content-type": "application/json",
        },
        body: {
          siteName: "Nový název webu",
          contactEmail: "novy@email.cz",
        },
      })

      expect(result).toEqual({ success: true })

      // Verify settings were updated
      const settings = await $fetch("/api/settings")
      expect(settings.siteName).toBe("Nový název webu")
      expect(settings.contactEmail).toBe("novy@email.cz")
    })

    it("preserves other settings when updating a subset", async () => {
      const sessionCookie = await loginAs("admin", "admin123")

      // Get current settings
      const before = await $fetch("/api/settings")

      // Update only one setting
      await $fetch("/api/settings", {
        method: "PUT",
        headers: {
          cookie: sessionCookie,
          "content-type": "application/json",
        },
        body: {
          contactPhone: "+420 999 888 777",
        },
      })

      const after = await $fetch("/api/settings")
      expect(after.contactPhone).toBe("+420 999 888 777")
      // Other settings unchanged
      expect(after.contactEmail).toBe(before.contactEmail)
      expect(after.googleCalendarId).toBe(before.googleCalendarId)
    })

    it("rejects empty body", async () => {
      const sessionCookie = await loginAs("admin", "admin123")

      await expect(
        $fetch("/api/settings", {
          method: "PUT",
          headers: {
            cookie: sessionCookie,
            "content-type": "application/json",
          },
          body: {},
        }),
      ).rejects.toMatchObject({
        statusCode: 400,
      })
    })

    it("rejects non-object body", async () => {
      const sessionCookie = await loginAs("admin", "admin123")

      await expect(
        $fetch("/api/settings", {
          method: "PUT",
          headers: {
            cookie: sessionCookie,
            "content-type": "application/json",
          },
          body: "not an object",
        }),
      ).rejects.toMatchObject({
        statusCode: 400,
      })
    })

    it("returns 401 for unauthenticated request", async () => {
      await expect(
        $fetch("/api/settings", {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: { siteName: "test" },
        }),
      ).rejects.toMatchObject({
        statusCode: 401,
      })
    })

    it("returns 403 for editor", async () => {
      const sessionCookie = await loginAs("editor", "editor123")

      await expect(
        $fetch("/api/settings", {
          method: "PUT",
          headers: {
            cookie: sessionCookie,
            "content-type": "application/json",
          },
          body: { siteName: "test" },
        }),
      ).rejects.toMatchObject({
        statusCode: 403,
      })
    })

    it("returns 403 for registered user", async () => {
      const sessionCookie = await loginAs("uzivatel", "user123")

      await expect(
        $fetch("/api/settings", {
          method: "PUT",
          headers: {
            cookie: sessionCookie,
            "content-type": "application/json",
          },
          body: { siteName: "test" },
        }),
      ).rejects.toMatchObject({
        statusCode: 403,
      })
    })

    it("restores original settings", async () => {
      const sessionCookie = await loginAs("admin", "admin123")

      // Restore seed values
      await $fetch("/api/settings", {
        method: "PUT",
        headers: {
          cookie: sessionCookie,
          "content-type": "application/json",
        },
        body: {
          siteName: "24. oddíl Junáka Hradec Králové",
          contactEmail: "info@24hk.cz",
          contactPhone: "+420 123 456 789",
        },
      })

      const settings = await $fetch("/api/settings")
      expect(settings.siteName).toBe("24. oddíl Junáka Hradec Králové")
      expect(settings.contactEmail).toBe("info@24hk.cz")
      expect(settings.contactPhone).toBe("+420 123 456 789")
    })
  })
})
