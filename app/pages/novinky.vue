<template>
  <div class="p-stack">
    <h1>Novinky</h1>
    <form @submit.prevent>
      <input
        v-model="searchInput"
        type="search"
        placeholder="Hledat v novinkách…"
        aria-label="Hledat v novinkách"
      />
    </form>
    <ul v-if="newsData?.items.length">
      <li v-for="item of newsData.items" :key="item.id" class="p-stack">
        <h2>{{ item.title }}</h2>
        <time v-if="item.datetime">{{ formatCzechDate(item.datetime) }}</time>
        <div v-if="item.content" v-html="item.content"></div>
      </li>
    </ul>
    <EmptyState v-else message="Žádné novinky." />

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

const searchInput = ref((route.query.hledat as string) || "")
const search = refDebounced(searchInput, 300)

const { data: newsData } = await useFetch("/api/news", {
  query: { page, perPage: 5, search },
  watch: [page, search],
})

const pagination = computed(() =>
  calculatePagination({
    page: newsData.value?.page ?? 1,
    perPage: newsData.value?.perPage ?? 5,
    totalCount: newsData.value?.totalCount ?? 0,
  }),
)
</script>
