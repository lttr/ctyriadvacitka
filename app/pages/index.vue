<template>
  <article v-if="introArticle" class="p-stack">
    <h1>{{ introArticle.title }}</h1>
    <div v-html="introArticle.content"></div>
  </article>
  <div v-else class="p-stack">
    <h1>Čtyřiadvacítka</h1>
    <p>24. oddíl Hradec Králové</p>
  </div>
</template>

<script setup lang="ts">
const { settings } = useSiteSettings()

const { data: articles } = await useFetch("/api/articles")
const introArticle = computed(() => {
  const id = settings.value.introArticleId
  if (!id || !articles.value) {
    return null
  }
  return articles.value.find((a: { id: number }) => String(a.id) === id)
})

useSeoMeta({
  title: settings.value.siteName || "Čtyřiadvacítka",
  description: "Webové stránky 24. oddílu Junáka v Hradci Králové",
})
</script>
