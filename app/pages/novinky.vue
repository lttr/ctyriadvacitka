<template>
  <div class="p-stack">
    <h1>Novinky</h1>
    <ul v-if="newsData?.items.length">
      <li v-for="item of newsData.items" :key="item.id" class="p-stack">
        <h2>
          <NuxtLink :to="`/novinka/${item.id}`">{{ item.title }}</NuxtLink>
        </h2>
        <time v-if="item.datetime">{{ formatCzechDate(item.datetime) }}</time>
        <div v-if="item.content" v-html="item.content"></div>
      </li>
    </ul>
    <p v-else>Žádné novinky.</p>

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
  title: "Novinky — Čtyřiadvacítka",
  description: "Aktuální novinky 24. oddílu Junáka Hradec Králové",
})

const route = useRoute()
const page = computed(() => Math.max(1, Number(route.query.stranka) || 1))

const { data: newsData } = await useFetch("/api/news", {
  query: { page, perPage: 10 },
  watch: [page],
})

const pagination = computed(() =>
  calculatePagination({
    page: newsData.value?.page ?? 1,
    perPage: newsData.value?.perPage ?? 10,
    totalCount: newsData.value?.totalCount ?? 0,
  }),
)
</script>
