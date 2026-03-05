<template>
  <article v-if="article" class="p-stack">
    <h1>{{ article.title }}</h1>
    <div v-html="article.content"></div>
  </article>
</template>

<script setup lang="ts">
const route = useRoute("clanek-url")
const url = computed(() => route.params.url)

const { data: article, error } = await useFetch(
  () => `/api/articles/${url.value}`,
)

if (error.value) {
  throw createError({
    statusCode: 404,
    statusMessage: "Článek nenalezen",
  })
}

useSeoMeta({
  title: () =>
    article.value
      ? `${article.value.title} — Čtyřiadvacítka`
      : "Čtyřiadvacítka",
})
</script>
