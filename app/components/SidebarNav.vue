<template>
  <nav v-if="menuArticles?.length">
    <h3>Navigace</h3>
    <ul>
      <li v-for="article of menuArticles" :key="article.id">
        <NuxtLink :to="`/${article.url}`">
          {{ article.title }}
        </NuxtLink>
      </li>
    </ul>
  </nav>
</template>

<script setup lang="ts">
const { data: menuArticles } = await useFetch("/api/articles/menu")
</script>
