<template>
  <div class="p-stack">
    <h1>Články</h1>
    <ul v-if="articles?.length" class="p-stack">
      <li v-for="article of articles" :key="article.id">
        <NuxtLink :to="`/clanek/${article.url}`">
          <h2>{{ article.title }}</h2>
        </NuxtLink>
        <time v-if="article.datetime">{{ formatDate(article.datetime) }}</time>
        <span v-if="article.author"> — {{ article.author }}</span>
      </li>
    </ul>
    <p v-else>Žádné články.</p>
  </div>
</template>

<script setup lang="ts">
const { data: articles } = await useFetch("/api/articles")

function formatDate(datetime: string): string {
  return new Date(datetime).toLocaleDateString("cs-CZ")
}
</script>
