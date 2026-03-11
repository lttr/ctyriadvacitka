<template>
  <div class="p-stack">
    <p>Odhlašování…</p>
  </div>
</template>

<script setup lang="ts">
const { user, logout, fetchSession } = useAuth()
const { show } = useFlashMessage()

await fetchSession()

if (!user.value) {
  show("Není přihlášen žádný uživatel.", "info")
  await navigateTo("/")
} else {
  await logout()
  show("Uživatel úspěšně odhlášen.")
  await navigateTo("/")
}
</script>
