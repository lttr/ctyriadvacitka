<template>
  <nav>
    <h3>Účet</h3>
    <ul v-if="isLoggedIn">
      <li>{{ user?.nickname || user?.username }}</li>
      <li>
        <NuxtLink to="/ucet">Nastavení účtu</NuxtLink>
      </li>
      <li v-if="isEditor">
        <NuxtLink to="/administrace">Administrace</NuxtLink>
      </li>
      <li>
        <button type="button" @click="handleLogout">Odhlásit se</button>
      </li>
    </ul>
    <ul v-else>
      <li>
        <NuxtLink to="/prihlaseni">Přihlásit se</NuxtLink>
      </li>
      <li>
        <NuxtLink to="/registrace">Registrace</NuxtLink>
      </li>
    </ul>
  </nav>
</template>

<script setup lang="ts">
const { user, isLoggedIn, isEditor, logout, fetchSession } = useAuth()

onMounted(() => {
  fetchSession()
})

async function handleLogout() {
  await logout()
  await navigateTo("/")
}
</script>
