import { describe, expect, it } from "vitest"

import { buildSeoDefaults } from "~~/app/plugins/seo"

describe("buildSeoDefaults", () => {
  it("returns default SEO meta when no site name provided", () => {
    const result = buildSeoDefaults("")

    expect(result.ogSiteName).toBe("Čtyřiadvacítka")
    expect(result.ogType).toBe("website")
    expect(result.description).toBe(
      "Webové stránky 24. oddílu Junáka v Hradci Králové",
    )
  })

  it("uses provided site name for ogSiteName", () => {
    const result = buildSeoDefaults("Můj oddíl")

    expect(result.ogSiteName).toBe("Můj oddíl")
  })

  it("always sets ogType to website", () => {
    const result = buildSeoDefaults("Test")

    expect(result.ogType).toBe("website")
  })

  it("includes default description", () => {
    const result = buildSeoDefaults("Test")

    expect(result.description).toBe(
      "Webové stránky 24. oddílu Junáka v Hradci Králové",
    )
  })
})
