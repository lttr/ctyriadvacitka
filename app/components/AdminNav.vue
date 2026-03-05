<template>
  <nav>
    <ul>
      <li>
        <NuxtLink to="/administrace">Přehled</NuxtLink>
      </li>
      <li>
        <NuxtLink to="/administrace/clanky">Články</NuxtLink>
      </li>
      <li>
        <NuxtLink to="/administrace/novinky">Novinky</NuxtLink>
      </li>
      <li v-if="isAdmin">
        <NuxtLink to="/administrace/uzivatele">Uživatelé</NuxtLink>
      </li>
      <li v-if="isAdmin">
        <NuxtLink to="/administrace/web">Nastavení webu</NuxtLink>
      </li>
      <li v-if="isAdmin">
        <NuxtLink to="/administrace/kontakty">Kontaktní údaje</NuxtLink>
      </li>
      <li>
        <NuxtLink to="/">Zpět na web</NuxtLink>
      </li>
    </ul>
  </nav>
</template>

<script setup lang="ts">
defineProps<{
  isAdmin?: boolean
}>()
</script>
