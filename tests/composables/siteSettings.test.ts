import { describe, expect, it } from "vitest"

import {
  type SiteSettings,
  parseSiteSettings,
} from "~~/app/composables/useSiteSettings"

describe("parseSiteSettings", () => {
  it("parses a valid settings object", () => {
    const raw = {
      siteName: "24. oddíl Junáka Hradec Králové",
      contactEmail: "info@24hk.cz",
      contactPhone: "+420 123 456 789",
      contactAddress: "Klubovna, Hradec Králové",
      introArticleId: "1",
      googleCalendarId: "example@group.calendar.google.com",
    }

    const result = parseSiteSettings(raw)

    expect(result).toEqual({
      siteName: "24. oddíl Junáka Hradec Králové",
      contactEmail: "info@24hk.cz",
      contactPhone: "+420 123 456 789",
      contactAddress: "Klubovna, Hradec Králové",
      introArticleId: "1",
      googleCalendarId: "example@group.calendar.google.com",
    })
  })

  it("returns defaults for missing keys", () => {
    const result = parseSiteSettings({})

    expect(result).toEqual({
      siteName: "",
      contactEmail: "",
      contactPhone: "",
      contactAddress: "",
      introArticleId: "",
      googleCalendarId: "",
    })
  })

  it("returns defaults for null input", () => {
    const result = parseSiteSettings(null)

    expect(result).toEqual({
      siteName: "",
      contactEmail: "",
      contactPhone: "",
      contactAddress: "",
      introArticleId: "",
      googleCalendarId: "",
    })
  })

  it("handles partial settings", () => {
    const result = parseSiteSettings({
      siteName: "Test Site",
      contactEmail: "test@test.cz",
    })

    expect(result.siteName).toBe("Test Site")
    expect(result.contactEmail).toBe("test@test.cz")
    expect(result.contactPhone).toBe("")
    expect(result.contactAddress).toBe("")
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
