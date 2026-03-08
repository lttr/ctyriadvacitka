import { describe, expect, it } from "vitest"

import {
  type SiteSettings,
  parseContactInfo,
  parseSiteSettings,
} from "~~/app/composables/useSiteSettings"

describe("parseSiteSettings", () => {
  it("parses a valid settings object", () => {
    const raw = {
      siteName: "24. oddíl Junáka Hradec Králové",
      siteDescription: "Skautský oddíl",
      contactEmail: "info@24hk.cz",
      contactPhone: "+420 123 456 789",
      contactAddress: "Klubovna, Hradec Králové",
      introArticleId: "1",
      googleCalendarId: "example@group.calendar.google.com",
    }

    const result = parseSiteSettings(raw)

    expect(result).toEqual({
      siteName: "24. oddíl Junáka Hradec Králové",
      siteDescription: "Skautský oddíl",
      contactEmail: "info@24hk.cz",
      contactPhone: "+420 123 456 789",
      contactAddress: "Klubovna, Hradec Králové",
      introArticleId: "1",
      googleCalendarId: "example@group.calendar.google.com",
      contactInfo: [],
    })
  })

  it("returns defaults for missing keys", () => {
    const result = parseSiteSettings({})

    expect(result).toEqual({
      siteName: "",
      siteDescription: "",
      contactEmail: "",
      contactPhone: "",
      contactAddress: "",
      introArticleId: "",
      googleCalendarId: "",
      contactInfo: [],
    })
  })

  it("returns defaults for null input", () => {
    const result = parseSiteSettings(null)

    expect(result).toEqual({
      siteName: "",
      siteDescription: "",
      contactEmail: "",
      contactPhone: "",
      contactAddress: "",
      introArticleId: "",
      googleCalendarId: "",
      contactInfo: [],
    })
  })

  it("handles partial settings", () => {
    const result = parseSiteSettings({
      siteName: "Test Site",
      contactEmail: "test@test.cz",
    })

    expect(result.siteName).toBe("Test Site")
    expect(result.siteDescription).toBe("")
    expect(result.contactEmail).toBe("test@test.cz")
    expect(result.contactPhone).toBe("")
    expect(result.contactAddress).toBe("")
    expect(result.contactInfo).toEqual([])
  })

  it("parses contactInfo from JSON string", () => {
    const persons = [
      {
        name: "Jan",
        role: "vedoucí",
        nickname: "Honza",
        phone: "123",
        email: "jan@test.cz",
      },
    ]
    const result = parseSiteSettings({
      siteName: "Test",
      contactInfo: JSON.stringify(persons),
    })

    expect(result.contactInfo).toEqual(persons)
  })

  it("satisfies SiteSettings type contract", () => {
    const settings: SiteSettings = parseSiteSettings({
      siteName: "Test",
      contactEmail: "test@test.cz",
      contactPhone: "123",
      contactAddress: "Addr",
      introArticleId: "1",
      googleCalendarId: "cal@cal.com",
    })

    expect(settings.siteName).toBe("Test")
    expect(settings.contactEmail).toBe("test@test.cz")
  })
})

describe("parseContactInfo", () => {
  it("parses valid JSON array of contact persons", () => {
    const persons = [
      {
        name: "Jan",
        role: "vedoucí",
        nickname: "Honza",
        phone: "123",
        email: "jan@test.cz",
      },
      { name: "Petra", role: "zástupce", nickname: "", phone: "", email: "" },
    ]

    const result = parseContactInfo(JSON.stringify(persons))

    expect(result).toEqual(persons)
  })

  it("returns empty array for null", () => {
    expect(parseContactInfo(null)).toEqual([])
  })

  it("returns empty array for undefined", () => {
    expect(parseContactInfo(undefined)).toEqual([])
  })

  it("returns empty array for empty string", () => {
    expect(parseContactInfo("")).toEqual([])
  })

  it("returns empty array for invalid JSON", () => {
    expect(parseContactInfo("not-json")).toEqual([])
  })

  it("returns empty array for non-array JSON", () => {
    expect(parseContactInfo(JSON.stringify({ name: "test" }))).toEqual([])
  })
})
