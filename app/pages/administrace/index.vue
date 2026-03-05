<template>
  <div>
    <h1>Administrace</h1>

    <div v-if="stats" class="p-stack">
      <div class="p-cluster">
        <NuxtLink to="/administrace/clanky" class="p-card">
          <strong>{{ stats.articleCount }}</strong>
          <span>Články</span>
        </NuxtLink>
        <NuxtLink to="/administrace/novinky" class="p-card">
          <strong>{{ stats.newsCount }}</strong>
          <span>Novinky</span>
        </NuxtLink>
        <NuxtLink to="/administrace/uzivatele" class="p-card">
          <strong>{{ stats.userCount }}</strong>
          <span>Uživatelé</span>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: "admin",
  middleware: "admin",
})

useSeoMeta({
  title: "Administrace — Čtyřiadvacítka",
})

const { data: stats } = await useFetch("/api/admin/stats")
</script>
