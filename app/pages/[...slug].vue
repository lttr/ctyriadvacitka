<template>
  <article v-if="article" class="p-stack">
    <p v-if="isEditor">
      <NuxtLink :to="`/administrace/clanky/editor/${article.url}`">
        Upravit
      </NuxtLink>
    </p>
    <div v-if="article.content" v-html="article.content"></div>
  </article>
</template>

<script setup lang="ts">
const { isEditor } = useAuth()

const route = useRoute("slug")
const slug = computed(() => {
  const parts = route.params.slug
  return Array.isArray(parts) ? parts.join("/") : (parts ?? "")
})

const { data: article, error } = await useFetch(
  () => `/api/articles/${slug.value}`,
)

if (error.value) {
  throw createError({
    statusCode: 404,
    statusMessage: "Stránka nenalezena",
  })
}

useSeoMeta({
  title: () =>
    article.value
      ? `${article.value.title} — Čtyřiadvacítka`
      : "Čtyřiadvacítka",
})
</script>
