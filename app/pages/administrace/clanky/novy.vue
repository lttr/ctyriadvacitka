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
        <label for="content">Obsah</label>
        <textarea id="content" v-model="form.content" rows="15"></textarea>
      </div>

      <div>
        <label for="author">Autor</label>
        <input id="author" v-model="form.author" type="text" />
      </div>

      <div class="p-cluster">
        <label>
          <input v-model="form.inMenu" type="checkbox" />
          Zobrazit v menu
        </label>
        <label>
          <input v-model="form.requestable" type="checkbox" />
          Přihláška
        </label>
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
  title: "Nový článek — Administrace — Čtyřiadvacítka",
})

const form = reactive({
  title: "",
  url: "",
  content: "",
  author: "",
  inMenu: false,
  requestable: false,
})

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
        author: form.author || null,
        datetime: new Date().toISOString(),
        inMenu: form.inMenu,
        requestable: form.requestable,
      },
    })
    await navigateTo("/administrace/clanky")
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
