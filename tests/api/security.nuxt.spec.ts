// @vitest-environment node
import { describe, expect, it } from "vitest"
import { setup, fetch } from "@nuxt/test-utils/e2e"

describe("security headers", async () => {
  await setup({ server: true })

  it("sets X-Content-Type-Options header", async () => {
    const response = await fetch("/")

    expect(response.headers.get("x-content-type-options")).toBe("nosniff")
  })

  it("sets X-Frame-Options header", async () => {
    const response = await fetch("/")

    expect(response.headers.get("x-frame-options")).toBe("SAMEORIGIN")
  })

  it("sets Referrer-Policy header", async () => {
    const response = await fetch("/")

    expect(response.headers.get("referrer-policy")).toBe("no-referrer")
  })

  it("sets X-XSS-Protection header", async () => {
    const response = await fetch("/")

    expect(response.headers.get("x-xss-protection")).toBe("0")
  })

  it("sets Content-Security-Policy header", async () => {
    const response = await fetch("/")

    const csp = response.headers.get("content-security-policy")
    expect(csp).toBeTruthy()
    expect(csp).toContain("script-src")
    expect(csp).toContain("img-src")
  })

  it("does not expose server information", async () => {
    const response = await fetch("/")

    expect(response.headers.get("x-powered-by")).toBeNull()
  })

  it("allows Google Calendar iframe via frame-src", async () => {
    const response = await fetch("/")

    const csp = response.headers.get("content-security-policy")
    expect(csp).toContain("calendar.google.com")
  })
})
