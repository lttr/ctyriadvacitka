export interface AuthUser {
  id: number
  username: string
  name: string | null
  surname: string | null
  nickname: string | null
  email: string | null
  role: string
}

export function parseAuthUser(response: unknown): AuthUser | null {
  if (!response || typeof response !== "object") {
    return null
  }
  const obj = response as Record<string, unknown>
  if (!obj.user || typeof obj.user !== "object") {
    return null
  }
  return obj.user as AuthUser
}

export function useAuth() {
  const user = useState<AuthUser | null>("auth-user", () => null)

  const isLoggedIn = computed(() => user.value !== null)
  const isEditor = computed(
    () => user.value?.role === "editor" || user.value?.role === "admin",
  )
  const isAdmin = computed(() => user.value?.role === "admin")

  async function fetchSession() {
    try {
      const data = await $fetch("/api/auth/session")
      user.value = parseAuthUser(data)
    } catch {
      user.value = null
    }
  }

  async function login(username: string, password: string) {
    const data = await $fetch("/api/auth/login", {
      method: "POST",
      body: { username, password },
    })
    user.value = parseAuthUser(data)
  }

  async function register(body: {
    username: string
    password: string
    name?: string
    surname?: string
    nickname?: string
    email?: string
  }) {
    await $fetch("/api/auth/register", {
      method: "POST",
      body,
    })
  }

  async function logout() {
    await $fetch("/api/auth/logout", {
      method: "POST",
    })
    user.value = null
  }

  return {
    user,
    isLoggedIn,
    isEditor,
    isAdmin,
    fetchSession,
    login,
    register,
    logout,
  }
}
