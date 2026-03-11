<template>
  <div class="p-stack">
    <h2>Přílohy</h2>

    <form class="p-stack" @submit.prevent="upload">
      <div>
        <label for="attachments">Přidat nové obrázky (lze více najednou)</label>
        <input
          id="attachments"
          ref="fileInput"
          type="file"
          accept="image/jpeg,image/png,image/gif"
          multiple
        />
      </div>

      <p>Soubory se objeví v přílohy.</p>

      <div>
        <button type="submit" :disabled="uploading">
          {{ uploading ? "Nahrávám…" : "Přidat" }}
        </button>
      </div>

      <p v-if="uploadMessage" role="status">{{ uploadMessage }}</p>
    </form>

    <div v-if="attachments?.length">
      <h3>Nahrané přílohy</h3>
      <div class="p-grid">
        <div v-for="attachment of attachments" :key="attachment.pathname" class="p-card">
          <img
            :src="`/api/attachments/${attachment.pathname}`"
            :alt="attachment.pathname"
            style="max-width: 100%; height: auto"
          />
          <p>{{ attachment.pathname }}</p>
          <button
            :disabled="deleting === attachment.pathname"
            @click="remove(attachment)"
          >
            {{ deleting === attachment.pathname ? "Mažu…" : "Smazat" }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface BlobItem {
  pathname: string
  contentType: string
}

const { data: attachments, refresh } =
  await useFetch<BlobItem[]>("/api/attachments")

const fileInput = ref<HTMLInputElement>()
const uploading = ref(false)
const deleting = ref("")
const uploadMessage = ref("")

const { show } = useFlashMessage()

async function upload() {
  const files = fileInput.value?.files
  if (!files?.length) {
    uploadMessage.value = "Musíte vybrat nejméně 1 obrázek!"
    return
  }

  uploading.value = true
  uploadMessage.value = ""

  try {
    const formData = new FormData()
    for (const file of files) {
      formData.append("files", file)
    }

    await $fetch("/api/attachments", {
      method: "POST",
      body: formData,
    })

    uploadMessage.value = "Přílohy byly nahrány."
    if (fileInput.value) {
      fileInput.value.value = ""
    }
    await refresh()
  } catch {
    uploadMessage.value = "Nepodařilo se nahrát přílohy."
  } finally {
    uploading.value = false
  }
}

async function remove(attachment: BlobItem) {
  deleting.value = attachment.pathname

  try {
    await $fetch(`/api/attachments/${attachment.pathname}` as string, {
      method: "DELETE",
    })
    show("Příloha odstraněna.")
    await refresh()
  } catch {
    uploadMessage.value = "Nepodařilo se smazat přílohu."
  } finally {
    deleting.value = ""
  }
}
</script>
