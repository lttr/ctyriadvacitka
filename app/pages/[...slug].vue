<template>
  <article v-if="displayArticle" class="p-stack">
    <p v-if="isEditor && !isErrorPage">
      <NuxtLink :to="`/administrace/clanky/${displayArticle.url}`">
        Upravit
      </NuxtLink>
    </p>
    <p v-if="isEditor && isErrorPage">
      <NuxtLink :to="`/administrace/clanky/novy?url=${slug}`">
        Vytvořit stránku
      </NuxtLink>
    </p>
    <!-- eslint-disable-next-line vue/no-v-html -->
    <div v-if="displayArticle.content" v-html="displayArticle.content"></div>
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

const isErrorPage = computed(() => !!error.value)

const { data: errorArticle } = error.value
  ? await useFetch("/api/articles/chyba")
  : { data: ref<Article | null>(null) }

const displayArticle = computed(() => {
  if (article.value) {
    return article.value
  }
  if (errorArticle?.value) {
    return errorArticle.value
  }
  return null
})

if (error.value && !errorArticle?.value) {
  throw createError({
    statusCode: 404,
    message: "Stránka nenalezena",
  })
}

useSeoMeta({
  title: () =>
    displayArticle.value
      ? `${displayArticle.value.title} — Čtyřiadvacítka`
      : "Čtyřiadvacítka",
})
</script>
