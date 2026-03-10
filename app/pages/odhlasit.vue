<template>
  <div class="p-stack">
    <p>Odhlašování…</p>
  </div>
</template>

<script setup lang="ts">
const { user, logout, fetchSession } = useAuth()

await fetchSession()

if (!user.value) {
  await navigateTo("/")
} else {
  await logout()
  await navigateTo("/")
}
</script>
