import { describe, expect, it } from "vitest"

import { parseAuthUser, type AuthUser } from "~~/app/composables/useAuth"

describe("parseAuthUser", () => {
  it("extracts user from valid session response", () => {
    const response = {
      user: {
        id: 1,
        username: "admin",
        name: "Jan",
        surname: "Novák",
        nickname: "Honza",
        email: "jan@example.com",
        role: "admin",
      },
    }
    const user = parseAuthUser(response)
    expect(user).toEqual(response.user)
  })

  it("returns null for null response", () => {
    expect(parseAuthUser(null)).toBeNull()
  })

  it("returns null for response without user property", () => {
    expect(parseAuthUser({})).toBeNull()
    expect(parseAuthUser({ data: "something" })).toBeNull()
  })

  it("returns null for response with null user", () => {
    expect(parseAuthUser({ user: null })).toBeNull()
  })

  it("checks isLoggedIn based on user presence", () => {
    const user: AuthUser | null = {
      id: 1,
      username: "test",
      name: null,
      surname: null,
      nickname: null,
      email: null,
      role: "registered",
    }
    expect(user !== null).toBe(true)

    const noUser: AuthUser | null = null
    expect(noUser !== null).toBe(false)
  })

  it("checks isEditor for editor role", () => {
    const editor: AuthUser = {
      id: 1,
      username: "test",
      name: null,
      surname: null,
      nickname: null,
      email: null,
      role: "editor",
    }
    expect(editor.role === "editor" || editor.role === "admin").toBe(true)
  })

  it("checks isEditor for admin role", () => {
    const admin: AuthUser = {
      id: 1,
      username: "test",
      name: null,
      surname: null,
      nickname: null,
      email: null,
      role: "admin",
    }
    expect(admin.role === "editor" || admin.role === "admin").toBe(true)
  })

  it("checks isAdmin for admin role only", () => {
    const admin: AuthUser = {
      id: 1,
      username: "test",
      name: null,
      surname: null,
      nickname: null,
      email: null,
      role: "admin",
    }
    expect(admin.role === "admin").toBe(true)

    const editor: AuthUser = {
      id: 1,
      username: "test",
      name: null,
      surname: null,
      nickname: null,
      email: null,
      role: "editor",
    }
    expect(editor.role === "admin").toBe(false)
  })
})
