<template>
  <section v-if="recentNews?.length">
    <h3>Novinky</h3>
    <ul>
      <li v-for="item of recentNews" :key="item.id">
        {{ item.title }}
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
const { data: recentNews } = await useFetch("/api/news/recent")
</script>
