<template>
  <div class="p-layout-wrapper">
    <header class="p-page-layout">
      <div class="p-content">
        <NuxtLink to="/">
          <strong>Čtyřiadvacítka</strong>
        </NuxtLink>
      </div>
    </header>
    <div class="p-page-layout">
      <div class="p-content">
        <main class="p-stack">
          <h1>{{ title }}</h1>
          <p>{{ message }}</p>
          <p>
            <NuxtLink to="/">Zpět na úvodní stránku</NuxtLink>
          </p>
        </main>
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
import type { NuxtError } from "#app"

const props = defineProps<{
  error: NuxtError
}>()

const title = computed(() => {
  if (props.error.statusCode === 404) {return "Stránka nenalezena"}
  return "Nastala chyba"
})

const message = computed(() => {
  if (props.error.statusCode === 404) {
    return "Požadovaná stránka nebyla nalezena. Zkontrolujte prosím adresu."
  }
  return "Omlouváme se, něco se pokazilo. Zkuste to prosím později."
})

useHead({
  title: title.value,
})
</script>
