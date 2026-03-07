<template>
  <div class="p-stack">
    <h1>Články</h1>
    <form @submit.prevent>
      <input
        v-model="searchInput"
        type="search"
        placeholder="Hledat v článcích…"
        aria-label="Hledat v článcích"
      />
    </form>
    <ul v-if="articlesData?.items.length" class="p-stack">
      <li v-for="article of articlesData.items" :key="article.id">
        <NuxtLink :to="`/clanek/${article.url}`">
          <h2>{{ article.title }}</h2>
        </NuxtLink>
        <time v-if="article.datetime">{{
          formatCzechDate(article.datetime)
        }}</time>
        <span v-if="article.author"> — {{ article.author }}</span>
      </li>
    </ul>
    <EmptyState v-else message="Žádné články." />

    <nav v-if="pagination.totalPages > 1" aria-label="Stránkování">
      <NuxtLink
        v-if="pagination.hasPrev"
        :to="{ query: { stranka: pagination.page - 1 } }"
      >
        Předchozí
      </NuxtLink>
      <span v-for="p of pagination.pages" :key="p">
        <NuxtLink v-if="p !== pagination.page" :to="{ query: { stranka: p } }">
          {{ p }}
        </NuxtLink>
        <strong v-else>{{ p }}</strong>
      </span>
      <NuxtLink
        v-if="pagination.hasNext"
        :to="{ query: { stranka: pagination.page + 1 } }"
      >
        Další
      </NuxtLink>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { calculatePagination } from "~~/app/composables/usePagination"
import { formatCzechDate } from "~~/shared/utils/date"

useSeoMeta({
  title: "Články — Čtyřiadvacítka",
  description: "Články 24. oddílu Junáka Hradec Králové",
})

const route = useRoute()
const page = computed(() => Math.max(1, Number(route.query.stranka) || 1))

const searchInput = ref((route.query.hledat as string) || "")
const search = refDebounced(searchInput, 300)

const { data: articlesData } = await useFetch("/api/articles", {
  query: { page, perPage: 10, search },
  watch: [page, search],
})

const pagination = computed(() =>
  calculatePagination({
    page: articlesData.value?.page ?? 1,
    perPage: articlesData.value?.perPage ?? 10,
    totalCount: articlesData.value?.totalCount ?? 0,
  }),
)
</script>
