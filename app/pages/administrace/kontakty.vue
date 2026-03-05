<template>
  <div>
    <h1>Kontaktní údaje</h1>

    <form v-if="settings" class="p-stack" @submit.prevent="save">
      <div>
        <label for="contactEmail">E-mail</label>
        <input id="contactEmail" v-model="form.contactEmail" type="email" />
      </div>

      <div>
        <label for="contactPhone">Telefon</label>
        <input id="contactPhone" v-model="form.contactPhone" type="tel" />
      </div>

      <div>
        <label for="contactAddress">Adresa</label>
        <textarea
          id="contactAddress"
          v-model="form.contactAddress"
          rows="3"
        ></textarea>
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
  title: "Kontaktní údaje — Administrace — Čtyřiadvacítka",
})

const { settings } = useSiteSettings()

const form = reactive({
  contactEmail: settings.value.contactEmail,
  contactPhone: settings.value.contactPhone,
  contactAddress: settings.value.contactAddress,
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
        contactEmail: form.contactEmail,
        contactPhone: form.contactPhone,
        contactAddress: form.contactAddress,
      },
    })
    message.value = "Kontaktní údaje byly uloženy."
  } catch {
    message.value = "Nepodařilo se uložit kontaktní údaje."
  } finally {
    saving.value = false
  }
}
</script>
