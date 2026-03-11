<template>
  <div>
    <h1>Nový článek</h1>

    <form class="p-stack" @submit.prevent="create">
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
          {{ saving ? "Vytvářím…" : "Vytvořit" }}
        </button>
      </div>

      <p v-if="error" role="alert">{{ error }}</p>
    </form>

    <AttachmentsUpload />
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: "admin",
  middleware: "admin",
})

useSeoMeta({
  title: "Nový článek — Administrace — Čtyřiadvacítka",
})

const route = useRoute()
const { user } = useAuth()
const today = new Date().toISOString().slice(0, 10)

const form = reactive({
  title: "",
  url: (route.query.url as string) || "",
  content: "",
  date: today,
  inMenu: false,
  requestable: true,
})

const { show } = useFlashMessage()
const saving = ref(false)
const error = ref("")

async function create() {
  saving.value = true
  error.value = ""

  try {
    await $fetch("/api/articles", {
      method: "POST",
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
    show("Článek byl úspěšně uložen.")
    await navigateTo(`/${form.url}`)
  } catch (e: unknown) {
    const fetchError = e as { statusCode?: number; statusMessage?: string }
    if (fetchError.statusCode === 409) {
      error.value = "Článek s touto URL již existuje."
    } else {
      error.value = "Nepodařilo se vytvořit článek."
    }
  } finally {
    saving.value = false
  }
}
</script>
