<template>
  <div>
    <div class="p-cluster" style="justify-content: space-between">
      <h1>Novinky</h1>
      <NuxtLink to="/administrace/novinky/novy">Nova novinka</NuxtLink>
    </div>

    <div v-if="newsData && newsData.items.length > 0" class="p-stack">
      <table>
        <thead>
          <tr>
            <th>Nazev</th>
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
            <td>{{ item.datetime ? formatDate(item.datetime) : "—" }}</td>
            <td>
              <NuxtLink :to="`/administrace/novinky/${item.id}`">
                Upravit
              </NuxtLink>
              <button type="button" @click="deleteNewsItem(item.id)">
                Smazat
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <p v-else-if="newsData">Zadne novinky.</p>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: "admin",
  middleware: "admin",
})

useSeoMeta({
  title: "Novinky — Administrace — Ctyriadvacitka",
})

const { data: newsData, refresh } = await useFetch("/api/news", {
  query: { perPage: 50 },
})

function formatDate(datetime: string): string {
  return new Date(datetime).toLocaleDateString("cs-CZ")
}

async function deleteNewsItem(id: number) {
  if (!confirm("Opravdu smazat tuto novinku?")) {
    return
  }
  await $fetch(`/api/news/${id}` as string, {
    method: "DELETE",
  })
  await refresh()
}
</script>
