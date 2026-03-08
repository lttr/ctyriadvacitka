<template>
  <div class="p-layout-wrapper">
    <header class="p-page-layout">
      <div class="p-content">
        <NuxtLink to="/administrace">
          <strong>Čtyřiadvacítka — Administrace</strong>
        </NuxtLink>
      </div>
    </header>
    <div class="p-page-layout">
      <div class="p-content p-with-sidebar">
        <main>
          <FlashMessage />
          <slot></slot>
        </main>
        <aside>
          <AdminNav :is-admin="user?.role === 'admin'" />
        </aside>
      </div>
    </div>
    <footer class="p-page-layout">
      <div class="p-content p-secondary-text-regular">
        24. oddíl Hradec Králové
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
const { data: session } = await useFetch("/api/auth/session")
const user = computed(() => session.value?.user)
</script>
