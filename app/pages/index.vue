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
const { data: settings } = await useFetch("/api/settings")
const introArticleId = computed(
  () => (settings.value as Record<string, string> | null)?.introArticleId,
)

const { data: articles } = await useFetch("/api/articles")
const introArticle = computed(() => {
  if (!introArticleId.value || !articles.value) {
    return null
  }
  return articles.value.find(
    (a: { id: number }) => String(a.id) === introArticleId.value,
  )
})
</script>
