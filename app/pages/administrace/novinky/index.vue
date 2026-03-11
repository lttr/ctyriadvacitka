<template>
  <div>
    <div class="p-cluster" style="justify-content: space-between">
      <h1>Novinky</h1>
      <NuxtLink to="/administrace/novinky/novy">Nová novinka</NuxtLink>
    </div>

    <div v-if="newsData && newsData.items.length > 0" class="p-stack">
      <table>
        <thead>
          <tr>
            <th>Název</th>
            <th>Autor</th>
            <th>Datum</th>
            <th>Akce</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item of newsData.items" :key="item.id">
            <td>
              <NuxtLink :to="`/administrace/novinky/${item.id}`">
                {{ item.title }}
              </NuxtLink>
            </td>
            <td>{{ item.author || "—" }}</td>
            <td>{{ item.datetime ? formatCzechDate(item.datetime) : "—" }}</td>
            <td>
              <template v-if="canEdit(item)">
                <NuxtLink :to="`/administrace/novinky/${item.id}`">
                  Upravit
                </NuxtLink>
                <button type="button" @click="deleteNewsItem(item.id)">
                  Smazat
                </button>
              </template>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <EmptyState v-else-if="newsData" message="Žádné novinky." />
  </div>
</template>

<script setup lang="ts">
import { formatCzechDate } from "~~/shared/utils/date"

definePageMeta({
  layout: "admin",
  middleware: "admin",
})

useSeoMeta({
  title: "Novinky — Administrace — Čtyřiadvacítka",
})

const { user, isAdmin } = useAuth()
const { show } = useFlashMessage()

const { data: newsData, refresh } = await useFetch("/api/news", {
  query: { perPage: 50 },
})

function canEdit(item: { author: string | null }) {
  return isAdmin.value || item.author === user.value?.username
}

async function deleteNewsItem(id: number) {
  if (!confirm("Opravdu smazat tuto novinku?")) {
    return
  }
  await $fetch(`/api/news/${id}` as string, {
    method: "DELETE",
  })
  show("Novinka byla úspěšně odstraněna.")
  await refresh()
}
</script>
