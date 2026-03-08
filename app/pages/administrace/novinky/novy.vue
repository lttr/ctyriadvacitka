<template>
  <div>
    <h1>Nová novinka</h1>

    <form class="p-stack" @submit.prevent="create">
      <div>
        <label for="title">Název</label>
        <input id="title" v-model="form.title" type="text" required />
      </div>

      <div>
        <label for="content">Obsah</label>
        <textarea id="content" v-model="form.content" rows="15"></textarea>
      </div>

      <div>
        <label for="author">Autor</label>
        <input id="author" v-model="form.author" type="text" />
      </div>

      <div>
        <button type="submit" :disabled="saving">
          {{ saving ? "Vytvářím…" : "Vytvořit" }}
        </button>
      </div>

      <p v-if="error" role="alert">{{ error }}</p>
    </form>
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

const form = reactive({
  title: "",
  content: "",
  author: "",
})

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
        author: form.author || null,
        datetime: new Date().toISOString(),
      },
    })
    await navigateTo("/administrace/novinky")
  } catch {
    error.value = "Nepodařilo se vytvořit novinku."
  } finally {
    saving.value = false
  }
}
</script>
