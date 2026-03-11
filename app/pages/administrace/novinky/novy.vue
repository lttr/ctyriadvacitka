<template>
  <div>
    <h1>Nová novinka</h1>

    <form class="p-stack" @submit.prevent="create">
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
  title: "Nová novinka — Administrace — Čtyřiadvacítka",
})

const { user } = useAuth()
const today = new Date().toISOString().slice(0, 10)

const form = reactive({
  title: "",
  content: "",
  date: today,
})

const { show } = useFlashMessage()
const saving = ref(false)
const error = ref("")

async function create() {
  saving.value = true
  error.value = ""

  try {
    await $fetch("/api/news", {
      method: "POST",
      body: {
        title: form.title,
        content: form.content || null,
        author: user.value?.username || null,
        datetime: form.date
          ? new Date(form.date + "T12:00:00").toISOString()
          : null,
      },
    })
    show("Novinka byla úspěšně uložena.")
    await navigateTo("/administrace/novinky")
  } catch {
    error.value = "Nepodařilo se vytvořit novinku."
  } finally {
    saving.value = false
  }
}
</script>
