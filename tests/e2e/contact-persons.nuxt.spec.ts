// @vitest-environment node
import { createClient } from "@libsql/client"
import { drizzle } from "drizzle-orm/libsql"
import { beforeAll, describe, expect, it } from "vitest"
import { setup, $fetch, fetch } from "@nuxt/test-utils/e2e"

import { seedDatabase } from "~~/scripts/seed"
import * as schema from "~~/server/db/schema"

describe("contact persons feature", async () => {
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

  // --- API: contactInfo in settings ---

  describe("GET /api/settings (contactInfo)", () => {
    it("returns contactInfo as a JSON string from seeded data", async () => {
      const settings = await $fetch("/api/settings")

      expect(settings).toHaveProperty("contactInfo")
      const contactInfo = JSON.parse(settings.contactInfo)
      expect(contactInfo).toHaveLength(2)
      expect(contactInfo[0].name).toBe("Jan Novák")
      expect(contactInfo[0].role).toBe("hlavní vedoucí oddílu")
      expect(contactInfo[0].nickname).toBe("Honza")
      expect(contactInfo[0].phone).toBe("+420 111 222 333")
      expect(contactInfo[0].email).toBe("honza@24hk.cz")
      expect(contactInfo[1].name).toBe("Petra Svobodová")
      expect(contactInfo[1].role).toBe("vedoucí vlčat")
    })
  })

  describe("PUT /api/settings (contactInfo)", () => {
    it("updates contactInfo as admin", async () => {
      const sessionCookie = await loginAs("admin", "admin123")
      const newPersons = [
        {
          name: "Karel Malý",
          role: "vedoucí skautů",
          nickname: "Karlík",
          phone: "+420 777 888 999",
          email: "karlik@24hk.cz",
        },
      ]

      await $fetch("/api/settings", {
        method: "PUT",
        headers: {
          cookie: sessionCookie,
          "content-type": "application/json",
        },
        body: {
          contactInfo: JSON.stringify(newPersons),
        },
      })

      const settings = await $fetch("/api/settings")
      const contactInfo = JSON.parse(settings.contactInfo)
      expect(contactInfo).toHaveLength(1)
      expect(contactInfo[0].name).toBe("Karel Malý")
      expect(contactInfo[0].role).toBe("vedoucí skautů")
    })

    it("can save empty contact persons array", async () => {
      const sessionCookie = await loginAs("admin", "admin123")

      await $fetch("/api/settings", {
        method: "PUT",
        headers: {
          cookie: sessionCookie,
          "content-type": "application/json",
        },
        body: {
          contactInfo: JSON.stringify([]),
        },
      })

      const settings = await $fetch("/api/settings")
      const contactInfo = JSON.parse(settings.contactInfo)
      expect(contactInfo).toHaveLength(0)
    })

    it("restores seeded contact persons", async () => {
      const sessionCookie = await loginAs("admin", "admin123")

      const seededPersons = [
        {
          name: "Jan Novák",
          role: "hlavní vedoucí oddílu",
          nickname: "Honza",
          phone: "+420 111 222 333",
          email: "honza@24hk.cz",
        },
        {
          name: "Petra Svobodová",
          role: "vedoucí vlčat",
          nickname: "Péťa",
          phone: "+420 444 555 666",
          email: "peta@24hk.cz",
        },
      ]

      await $fetch("/api/settings", {
        method: "PUT",
        headers: {
          cookie: sessionCookie,
          "content-type": "application/json",
        },
        body: {
          contactInfo: JSON.stringify(seededPersons),
        },
      })

      const settings = await $fetch("/api/settings")
      const contactInfo = JSON.parse(settings.contactInfo)
      expect(contactInfo).toHaveLength(2)
    })
  })

  // --- Public contact page rendering ---

  describe("Contact page with contact persons", () => {
    it("renders contact persons from settings", async () => {
      const html = await $fetch("/kontakt")

      expect(html).toContain("Jan Novák")
      expect(html).toContain("hlavní vedoucí oddílu")
      expect(html).toContain("Honza")
      expect(html).toContain("+420 111 222 333")
      expect(html).toContain("honza@24hk.cz")
    })

    it("renders multiple contact persons", async () => {
      const html = await $fetch("/kontakt")

      expect(html).toContain("Petra Svobodová")
      expect(html).toContain("vedoucí vlčat")
      expect(html).toContain("Péťa")
    })

    it("renders contact persons section heading", async () => {
      const html = await $fetch("/kontakt")

      expect(html).toContain("Vedení oddílu")
    })
  })

  // --- Admin contact settings page ---

  describe("Admin contact settings page", () => {
    it("renders contact persons management for admin", async () => {
      const sessionCookie = await loginAs("admin", "admin123")

      const html = await $fetch("/administrace/kontakty", {
        headers: { cookie: sessionCookie },
      })

      expect(html).toContain("Kontaktní údaje")
      expect(html).toContain("Vedení oddílu")
      expect(html).toContain("Jan Novák")
      expect(html).toContain("Petra Svobodová")
    })

    it("renders add person button", async () => {
      const sessionCookie = await loginAs("admin", "admin123")

      const html = await $fetch("/administrace/kontakty", {
        headers: { cookie: sessionCookie },
      })

      expect(html).toContain("Přidat osobu")
    })
  })
})
