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
          <p v-if="createArticleUrl">
            <NuxtLink :to="createArticleUrl">
              Vytvořit stránku
            </NuxtLink>
          </p>
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
  if (props.error.statusCode === 404) {
    return "Stránka nenalezena"
  }
  return "Nastala chyba"
})

const message = computed(() => {
  if (props.error.statusCode === 404) {
    return "Požadovaná stránka nebyla nalezena. Zkontrolujte prosím adresu."
  }
  return "Omlouváme se, něco se pokazilo. Zkuste to prosím později."
})

const { isEditor, fetchSession } = useAuth()
await fetchSession()

const route = useRoute()

const createArticleUrl = computed(() => {
  if (props.error.statusCode !== 404 || !isEditor.value) {
    return null
  }
  const path = route.fullPath
  const match = path.match(/^\/clanek\/([^/]+)/)
  const slug = match?.[1]
  if (!slug) {
    return null
  }
  return `/administrace/clanky/novy?url=${encodeURIComponent(slug)}`
})

useHead({
  title: title.value,
})
</script>
