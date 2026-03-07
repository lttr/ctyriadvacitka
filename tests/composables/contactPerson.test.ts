import { describe, expect, it } from "vitest"

import {
  contactPersonSchema,
  contactPersonsSchema,
} from "~~/shared/types/contact"

describe("contactPersonSchema", () => {
  it("accepts valid contact person with all fields", () => {
    const result = contactPersonSchema.safeParse({
      name: "Jan Novák",
      role: "hlavní vedoucí oddílu",
      nickname: "Honza",
      phone: "+420 111 222 333",
      email: "honza@24hk.cz",
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.name).toBe("Jan Novák")
      expect(result.data.role).toBe("hlavní vedoucí oddílu")
      expect(result.data.nickname).toBe("Honza")
      expect(result.data.phone).toBe("+420 111 222 333")
      expect(result.data.email).toBe("honza@24hk.cz")
    }
  })

  it("accepts contact person with only required fields", () => {
    const result = contactPersonSchema.safeParse({
      name: "Jan Novák",
      role: "vedoucí",
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.name).toBe("Jan Novák")
      expect(result.data.role).toBe("vedoucí")
      expect(result.data.nickname).toBe("")
      expect(result.data.phone).toBe("")
      expect(result.data.email).toBe("")
    }
  })

  it("rejects contact person with empty name", () => {
    const result = contactPersonSchema.safeParse({
      name: "",
      role: "vedoucí",
    })

    expect(result.success).toBe(false)
  })

  it("rejects contact person with empty role", () => {
    const result = contactPersonSchema.safeParse({
      name: "Jan",
      role: "",
    })

    expect(result.success).toBe(false)
  })

  it("rejects contact person with missing name", () => {
    const result = contactPersonSchema.safeParse({
      role: "vedoucí",
    })

    expect(result.success).toBe(false)
  })

  it("rejects contact person with invalid email", () => {
    const result = contactPersonSchema.safeParse({
      name: "Jan",
      role: "vedoucí",
      email: "not-an-email",
    })

    expect(result.success).toBe(false)
  })
})

describe("contactPersonsSchema", () => {
  it("accepts valid array of contact persons", () => {
    const result = contactPersonsSchema.safeParse([
      {
        name: "Jan",
        role: "vedoucí",
        nickname: "Honza",
        phone: "123",
        email: "jan@test.cz",
      },
      { name: "Petra", role: "zástupce" },
    ])

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toHaveLength(2)
    }
  })

  it("accepts empty array", () => {
    const result = contactPersonsSchema.safeParse([])

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toHaveLength(0)
    }
  })

  it("rejects non-array input", () => {
    const result = contactPersonsSchema.safeParse({ name: "Jan" })

    expect(result.success).toBe(false)
  })

  it("rejects array with invalid person", () => {
    const result = contactPersonsSchema.safeParse([
      { name: "Jan", role: "vedoucí" },
      { name: "", role: "zástupce" },
    ])

    expect(result.success).toBe(false)
  })
})
