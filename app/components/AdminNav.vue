<template>
  <nav>
    <ul>
      <li>
        <NuxtLink to="/administrace">Administrace</NuxtLink>
      </li>
      <li>
        <NuxtLink to="/administrace/clanky">Články</NuxtLink>
      </li>
      <li>
        <NuxtLink to="/administrace/novinky">Novinky</NuxtLink>
      </li>
      <li v-if="isAdmin">
        <NuxtLink to="/administrace/hlavicka">Obrázky záhlaví</NuxtLink>
      </li>
      <li v-if="isAdmin">
        <NuxtLink to="/administrace/uzivatele">Uživatelé</NuxtLink>
      </li>
      <li>
        <NuxtLink to="/">Zpět</NuxtLink>
      </li>
    </ul>
  </nav>
</template>

<script setup lang="ts">
defineProps<{
  isAdmin?: boolean
}>()
</script>
