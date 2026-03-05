<template>
  <div>
    <h1>Nastavení webu</h1>

    <form v-if="settings" class="p-stack" @submit.prevent="save">
      <div>
        <label for="siteName">Název webu</label>
        <input id="siteName" v-model="form.siteName" type="text" />
      </div>

      <div>
        <label for="introArticleId">ID úvodního článku</label>
        <input id="introArticleId" v-model="form.introArticleId" type="text" />
      </div>

      <div>
        <label for="googleCalendarId">Google Calendar ID</label>
        <input
          id="googleCalendarId"
          v-model="form.googleCalendarId"
          type="text"
        />
      </div>

      <div>
        <button type="submit" :disabled="saving">
          {{ saving ? "Ukládám…" : "Uložit" }}
        </button>
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

useSeoMeta({
  title: "Nastavení webu — Administrace — Čtyřiadvacítka",
})

const { settings } = useSiteSettings()

const form = reactive({
  siteName: settings.value.siteName,
  introArticleId: settings.value.introArticleId,
  googleCalendarId: settings.value.googleCalendarId,
})

const saving = ref(false)
const message = ref("")

async function save() {
  saving.value = true
  message.value = ""

  try {
    await $fetch("/api/settings", {
      method: "PUT",
      body: {
        siteName: form.siteName,
        introArticleId: form.introArticleId,
        googleCalendarId: form.googleCalendarId,
      },
    })
    message.value = "Nastavení bylo uloženo."
  } catch {
    message.value = "Nepodařilo se uložit nastavení."
  } finally {
    saving.value = false
  }
}
</script>
