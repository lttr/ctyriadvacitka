import { createClient } from "@libsql/client"
import { eq } from "drizzle-orm"
import { drizzle } from "drizzle-orm/libsql"
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest"

import * as schema from "~~/server/db/schema"

const client = createClient({ url: ":memory:" })
const db = drizzle(client, { schema })

beforeAll(() => {
  client.executeMultiple(`
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
  await client.executeMultiple(`DELETE FROM site_settings;`)
})

describe("GET /api/settings — query logic", () => {
  it("returns all settings as key-value object", async () => {
    await db.insert(schema.siteSettings).values([
      { key: "siteName", value: "24. oddíl Junáka Hradec Králové" },
      { key: "contactEmail", value: "info@24hk.cz" },
      { key: "contactPhone", value: "+420 123 456 789" },
    ])

    const settings = await db.select().from(schema.siteSettings)
    const result = Object.fromEntries(settings.map((s) => [s.key, s.value]))

    expect(result).toEqual({
      siteName: "24. oddíl Junáka Hradec Králové",
      contactEmail: "info@24hk.cz",
      contactPhone: "+420 123 456 789",
    })
  })

  it("returns empty object when no settings exist", async () => {
    const settings = await db.select().from(schema.siteSettings)
    const result = Object.fromEntries(settings.map((s) => [s.key, s.value]))

    expect(result).toEqual({})
  })
})

describe("GET /api/settings/[key] — query logic", () => {
  it("returns a setting by key", async () => {
    await db.insert(schema.siteSettings).values([
      { key: "siteName", value: "24. oddíl Junáka Hradec Králové" },
      { key: "contactEmail", value: "info@24hk.cz" },
    ])

    const [result] = await db
      .select()
      .from(schema.siteSettings)
      .where(eq(schema.siteSettings.key, "siteName"))

    expect(result).toBeDefined()
    expect(result.key).toBe("siteName")
    expect(result.value).toBe("24. oddíl Junáka Hradec Králové")
  })

  it("returns undefined for non-existent key", async () => {
    await db
      .insert(schema.siteSettings)
      .values({ key: "siteName", value: "Test" })

    const [result] = await db
      .select()
      .from(schema.siteSettings)
      .where(eq(schema.siteSettings.key, "nonExistent"))

    expect(result).toBeUndefined()
  })

  it("handles keys with special characters", async () => {
    await db.insert(schema.siteSettings).values({
      key: "googleCalendarId",
      value: "example@group.calendar.google.com",
    })

    const [result] = await db
      .select()
      .from(schema.siteSettings)
      .where(eq(schema.siteSettings.key, "googleCalendarId"))

    expect(result.value).toBe("example@group.calendar.google.com")
  })

  it("returns setting with null value", async () => {
    await db
      .insert(schema.siteSettings)
      .values({ key: "emptyKey", value: null })

    const [result] = await db
      .select()
      .from(schema.siteSettings)
      .where(eq(schema.siteSettings.key, "emptyKey"))

    expect(result).toBeDefined()
    expect(result.key).toBe("emptyKey")
    expect(result.value).toBeNull()
  })
})
