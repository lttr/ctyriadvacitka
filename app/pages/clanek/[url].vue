<template>
  <article v-if="article" class="p-stack">
    <h1>{{ article.title }}</h1>
    <p v-if="article.datetime || article.author" class="p-text-secondary">
      <time v-if="article.datetime">{{
        formatCzechDate(article.datetime)
      }}</time>
      <span v-if="article.author"> — {{ article.author }}</span>
    </p>
    <div v-if="article.content" v-html="article.content"></div>
    <p>
      <NuxtLink to="/clanky">Zpět na články</NuxtLink>
    </p>
  </article>
</template>

<script setup lang="ts">
import { formatCzechDate } from "~~/shared/utils/date"

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
