<template>
  <div>
    <h1>Upravit článek</h1>

    <form v-if="article" class="p-stack" @submit.prevent="save">
      <div>
        <label for="title">Název</label>
        <input id="title" v-model="form.title" type="text" required />
      </div>

      <div>
        <label for="url">URL slug</label>
        <input id="url" v-model="form.url" type="text" required />
      </div>

      <div>
        <label>Obsah</label>
        <RichTextEditor v-model="form.content" />
      </div>

      <div>
        <label for="datetime">Datum</label>
        <input id="datetime" v-model="form.date" type="date" />
      </div>

      <div class="p-cluster">
        <label>
          <input v-model="form.inMenu" type="checkbox" />
          Zobrazit v menu
        </label>
        <label>
          <input v-model="form.requestable" type="checkbox" />
          Zobrazovat v seznamu
        </label>
      </div>

      <div>
        <button type="submit" :disabled="saving">
          {{ saving ? "Ukládám…" : "Uložit" }}
        </button>
        <NuxtLink to="/administrace/clanky">Zpět</NuxtLink>
      </div>

      <p v-if="message" role="status">{{ message }}</p>
    </form>

    <AttachmentsUpload />
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: "admin",
  middleware: "admin",
})

const route = useRoute("administrace-clanky-url")
const articleUrl = route.params.url
const { user } = useAuth()

const { data: article } = await useFetch<Article>(
  `/api/articles/${articleUrl}` as string,
)

if (!article.value) {
  throw createError({ statusCode: 404, statusMessage: "Článek nenalezen" })
}

useSeoMeta({
  title: `Upravit: ${article.value.title} — Administrace — Čtyřiadvacítka`,
})

const form = reactive({
  title: article.value.title,
  url: article.value.url,
  content: article.value.content ?? "",
  date: article.value.datetime
    ? new Date(article.value.datetime).toISOString().slice(0, 10)
    : "",
  inMenu: article.value.inMenu ?? false,
  requestable: article.value.requestable ?? false,
})

const saving = ref(false)
const message = ref("")

async function save() {
  saving.value = true
  message.value = ""

  try {
    await $fetch(`/api/articles/${articleUrl}` as string, {
      method: "PUT",
      body: {
        title: form.title,
        url: form.url,
        content: form.content || null,
        author: user.value?.username || null,
        datetime: form.date
          ? new Date(form.date + "T12:00:00").toISOString()
          : null,
        inMenu: form.inMenu,
        requestable: form.requestable,
      },
    })

    message.value = "Článek byl úspěšně uložen."

    // If URL changed, redirect to the new URL
    if (form.url !== articleUrl) {
      await navigateTo(`/administrace/clanky/${form.url}`)
    }
  } catch (e: unknown) {
    const fetchError = e as { statusCode?: number; statusMessage?: string }
    if (fetchError.statusCode === 409) {
      message.value = "Článek s touto URL již existuje."
    } else {
      message.value = "Nepodařilo se uložit článek."
    }
  } finally {
    saving.value = false
  }
}
</script>
