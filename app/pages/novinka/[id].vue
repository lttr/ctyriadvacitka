<template>
  <article v-if="newsItem" class="p-stack">
    <h1>{{ newsItem.title }}</h1>
    <p v-if="newsItem.datetime" class="p-text-secondary">
      <time>{{ formatDate(newsItem.datetime) }}</time>
      <span v-if="newsItem.author"> — {{ newsItem.author }}</span>
    </p>
    <div v-if="newsItem.content" v-html="newsItem.content"></div>
    <p>
      <NuxtLink to="/novinky">Zpět na novinky</NuxtLink>
    </p>
  </article>
</template>

<script setup lang="ts">
const route = useRoute("novinka-id")
const id = computed(() => route.params.id)

const { data: newsItem, error } = await useFetch(() => `/api/news/${id.value}`)

if (error.value) {
  throw createError({
    statusCode: 404,
    statusMessage: "Novinka nenalezena",
  })
}

function formatDate(datetime: string): string {
  return new Date(datetime).toLocaleDateString("cs-CZ")
}
</script>
