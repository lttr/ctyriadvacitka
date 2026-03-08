<template>
  <div>
    <div class="p-cluster" style="justify-content: space-between">
      <h1>Články</h1>
      <NuxtLink to="/administrace/clanky/novy">Nový článek</NuxtLink>
    </div>

    <div v-if="articles && articles.items.length > 0" class="p-stack">
      <table>
        <thead>
          <tr>
            <th>Název</th>
            <th>URL</th>
            <th>Autor</th>
            <th>Zobrazovat</th>
            <th>V menu</th>
            <th>Akce</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="article of articles.items" :key="article.id">
            <td>
              <NuxtLink :to="`/administrace/clanky/${article.url}`">
                {{ article.title }}
              </NuxtLink>
            </td>
            <td>{{ article.url }}</td>
            <td>{{ article.author || "—" }}</td>
            <td>
              {{ article.requestable ? "Ano" : "Ne" }}
            </td>
            <td>
              <button type="button" @click="toggleMenu(article.url)">
                {{ article.inMenu ? "V menu" : "—" }}
              </button>
            </td>
            <td>
              <NuxtLink :to="`/administrace/clanky/${article.url}`">
                Upravit
              </NuxtLink>
              <button type="button" @click="deleteArticle(article.url)">
                Smazat
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <EmptyState v-else-if="articles" message="Žádné články." />
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: "admin",
  middleware: "admin",
})

useSeoMeta({
  title: "Články — Administrace — Čtyřiadvacítka",
})

const { show } = useFlashMessage()

const { data: articles, refresh } = await useFetch("/api/articles", {
  query: { perPage: 50 },
})

async function toggleMenu(url: string) {
  await $fetch(`/api/articles/${url}/toggle-menu` as string, {
    method: "PATCH",
  })
  await refresh()
}

async function deleteArticle(url: string) {
  if (!confirm("Opravdu smazat tento článek?")) {
    return
  }
  await $fetch(`/api/articles/${url}` as string, {
    method: "DELETE",
  })
  show("Článek byl úspěšně odstraněn.")
  await refresh()
}
</script>
