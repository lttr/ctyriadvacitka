<template>
  <div>
    <h1>Obrázky hlavičky</h1>

    <form class="p-stack" @submit.prevent="upload">
      <div>
        <label for="file">Nahrát nový obrázek</label>
        <input
          id="file"
          ref="fileInput"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
        />
      </div>

      <div>
        <button type="submit" :disabled="uploading">
          {{ uploading ? "Nahrávám…" : "Nahrát" }}
        </button>
      </div>

      <p v-if="message" role="status">{{ message }}</p>
    </form>

    <h2>Nahrané obrázky</h2>

    <p v-if="!images?.length">Žádné obrázky hlavičky.</p>

    <div v-else class="p-grid">
      <div v-for="image of images" :key="image.pathname" class="p-card">
        <img
          :src="`/api/header-images/${image.pathname}`"
          :alt="image.pathname"
          style="max-width: 100%; height: auto"
        />
        <p>{{ image.pathname }}</p>
        <button :disabled="deleting === image.pathname" @click="remove(image)">
          {{ deleting === image.pathname ? "Mažu…" : "Smazat" }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: "admin",
  middleware: "admin",
})

useSeoMeta({
  title: "Obrázky hlavičky — Administrace — Čtyřiadvacítka",
})

interface BlobItem {
  pathname: string
  contentType: string
}

const { data: images, refresh } =
  await useFetch<BlobItem[]>("/api/header-images")

const fileInput = ref<HTMLInputElement>()
const uploading = ref(false)
const deleting = ref("")
const message = ref("")

async function upload() {
  const file = fileInput.value?.files?.[0]
  if (!file) {
    message.value = "Vyberte soubor."
    return
  }

  uploading.value = true
  message.value = ""

  try {
    const formData = new FormData()
    formData.append("file", file)

    await $fetch("/api/header-images", {
      method: "POST",
      body: formData,
    })

    message.value = "Obrázek byl nahrán."
    if (fileInput.value) {
      fileInput.value.value = ""
    }
    await refresh()
  } catch {
    message.value = "Nepodařilo se nahrát obrázek."
  } finally {
    uploading.value = false
  }
}

const { show } = useFlashMessage()

async function remove(image: BlobItem) {
  deleting.value = image.pathname

  try {
    await $fetch(`/api/header-images/${image.pathname}` as string, {
      method: "DELETE",
    })
    show("Obrázek odstraněn.")
    await refresh()
  } catch {
    message.value = "Nepodařilo se smazat obrázek."
  } finally {
    deleting.value = ""
  }
}
</script>
