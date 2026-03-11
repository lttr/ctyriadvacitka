export default defineNuxtRouteMiddleware(async () => {
  const { data: session } = await useFetch("/api/auth/session")

  if (!session.value?.user) {
    return navigateTo("/")
  }

  if (session.value.user.role !== "admin") {
    return navigateTo("/")
  }
})
