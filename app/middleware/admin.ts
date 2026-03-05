export default defineNuxtRouteMiddleware(async () => {
  const { data: session } = await useFetch("/api/auth/session")

  if (!session.value?.user) {
    return navigateTo("/")
  }

  const role = session.value.user.role
  if (role !== "editor" && role !== "admin") {
    return navigateTo("/")
  }
})
