<template>
  <div>
    <h1>Upravit novinku</h1>

    <form v-if="newsItem" class="p-stack" @submit.prevent="save">
      <div>
        <label for="title">Název</label>
        <input id="title" v-model="form.title" type="text" required />
      </div>

      <div>
        <label>Obsah</label>
        <RichTextEditor v-model="form.content" />
      </div>

      <div>
        <label for="datetime">Datum</label>
        <input id="datetime" v-model="form.date" type="date" />
      </div>

      <div>
        <label for="author">Autor</label>
        <input id="author" v-model="form.author" type="text" />
      </div>

      <div>
        <button type="submit" :disabled="saving">
          {{ saving ? "Ukládám…" : "Uložit novinku" }}
        </button>
        <NuxtLink to="/administrace/novinky">Zpět</NuxtLink>
      </div>

      <p v-if="message" role="status">{{ message }}</p>
    </form>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: "admin",
  middleware: "admin",
})

const route = useRoute("administrace-novinky-id")
const newsId = route.params.id

const { data: newsItem } = await useFetch<News>(`/api/news/${newsId}` as string)

if (!newsItem.value) {
  throw createError({ statusCode: 404, statusMessage: "Novinka nenalezena" })
}

useSeoMeta({
  title: `Upravit: ${newsItem.value.title} — Administrace — Čtyřiadvacítka`,
})

const form = reactive({
  title: newsItem.value.title,
  content: newsItem.value.content ?? "",
  date: newsItem.value.datetime
    ? new Date(newsItem.value.datetime).toISOString().slice(0, 10)
    : "",
  author: newsItem.value.author ?? "",
})

const saving = ref(false)
const message = ref("")

async function save() {
  saving.value = true
  message.value = ""

  try {
    await $fetch(`/api/news/${newsId}` as string, {
      method: "PUT",
      body: {
        title: form.title,
        content: form.content || null,
        author: form.author || null,
        datetime: form.date
          ? new Date(form.date + "T12:00:00").toISOString()
          : null,
      },
    })

    message.value = "Novinka byla uložena."
  } catch {
    message.value = "Nepodařilo se uložit novinku."
  } finally {
    saving.value = false
  }
}
</script>
