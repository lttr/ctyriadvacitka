<template>
  <div class="p-stack">
    <h1>Novinky</h1>

    <ul v-if="newsData?.items.length" class="p-stack">
      <li v-for="item of newsData.items" :key="item.id" class="p-stack">
        <h2>{{ item.title }}</h2>
        <time v-if="item.datetime">{{ formatCzechDate(item.datetime) }}</time>
        <div v-if="item.content" v-html="item.content"></div>
        <hr />
      </li>
    </ul>
    <EmptyState v-else message="Žádné novinky." />

    <nav v-if="pagination.totalPages > 1" aria-label="Stránkování">
      <NuxtLink
        v-if="pagination.hasPrev"
        :to="{ path: '/novinky', query: { stranka: pagination.page - 1 } }"
      >
        « Předchozí
      </NuxtLink>
      <NuxtLink
        v-if="pagination.hasNext"
        :to="{ path: '/novinky', query: { stranka: pagination.page + 1 } }"
      >
        Další »
      </NuxtLink>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { calculatePagination } from "~~/app/composables/usePagination"
import { formatCzechDate } from "~~/shared/utils/date"

const { settings } = useSiteSettings()

useSeoMeta({
  title: settings.value.siteName || "Čtyřiadvacítka",
  description:
    settings.value.siteDescription ||
    "Webové stránky 24. oddílu Junáka v Hradci Králové",
})

const { data: newsData } = await useFetch("/api/news", {
  query: { page: 1, perPage: 5 },
})

const pagination = computed(() =>
  calculatePagination({
    page: newsData.value?.page ?? 1,
    perPage: newsData.value?.perPage ?? 5,
    totalCount: newsData.value?.totalCount ?? 0,
  }),
)
</script>
