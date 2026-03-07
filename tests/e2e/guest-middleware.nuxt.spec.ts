// @vitest-environment node
import { createClient } from "@libsql/client"
import { drizzle } from "drizzle-orm/libsql"
import { beforeAll, describe, expect, it } from "vitest"
import { setup, fetch } from "@nuxt/test-utils/e2e"

import { seedDatabase } from "~~/scripts/seed"
import * as schema from "~~/server/db/schema"

describe("guest middleware", async () => {
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

  async function loginAs(username: string, password: string): Promise<string> {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ username, password }),
    })
    const cookies = response.headers.get("set-cookie") || ""
    return cookies.split(";")[0]
  }

  describe("login page (/prihlaseni)", () => {
    it("allows access for unauthenticated users", async () => {
      const response = await fetch("/prihlaseni", { redirect: "manual" })
      expect(response.status).toBe(200)
    })

    it("redirects authenticated users to /ucet", async () => {
      const sessionCookie = await loginAs("admin", "admin123")
      const response = await fetch("/prihlaseni", {
        headers: { cookie: sessionCookie },
        redirect: "manual",
      })

      expect([301, 302]).toContain(response.status)
      const location = response.headers.get("location") || ""
      expect(location).toContain("/ucet")
    })
  })

  describe("registration page (/registrace)", () => {
    it("allows access for unauthenticated users", async () => {
      const response = await fetch("/registrace", { redirect: "manual" })
      expect(response.status).toBe(200)
    })

    it("redirects authenticated users to /ucet", async () => {
      const sessionCookie = await loginAs("admin", "admin123")
      const response = await fetch("/registrace", {
        headers: { cookie: sessionCookie },
        redirect: "manual",
      })

      expect([301, 302]).toContain(response.status)
      const location = response.headers.get("location") || ""
      expect(location).toContain("/ucet")
    })
  })
})
