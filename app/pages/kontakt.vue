<template>
  <div class="p-stack">
    <h1>Kontakt</h1>

    <section class="p-stack">
      <h2>Kontaktní údaje</h2>
      <dl v-if="settings">
        <dt>E-mail</dt>
        <dd>
          <a :href="`mailto:${settings.contactEmail}`">
            {{ settings.contactEmail }}
          </a>
        </dd>
        <dt>Telefon</dt>
        <dd>{{ settings.contactPhone }}</dd>
        <dt>Adresa</dt>
        <dd>{{ settings.contactAddress }}</dd>
      </dl>
    </section>

    <section v-if="settings.contactInfo.length > 0" class="p-stack">
      <h2>Vedení oddílu</h2>
      <div
        v-for="person of settings.contactInfo"
        :key="person.name"
        class="p-stack"
      >
        <h3>
          {{ person.name }}
          <small v-if="person.nickname">({{ person.nickname }})</small>
        </h3>
        <p>{{ person.role }}</p>
        <p v-if="person.phone">
          Telefon:
          <a :href="`tel:${person.phone}`">{{ person.phone }}</a>
        </p>
        <p v-if="person.email">
          E-mail:
          <a :href="`mailto:${person.email}`">{{ person.email }}</a>
        </p>
      </div>
    </section>

    <section class="p-stack">
      <h2>Napište nám</h2>

      <p v-if="successMessage" role="status">{{ successMessage }}</p>
      <p v-if="errorMessage" role="alert">{{ errorMessage }}</p>

      <form @submit.prevent="handleSubmit">
        <div class="p-stack">
          <label for="contact-name">Jméno</label>
          <input id="contact-name" v-model="form.name" type="text" required />
        </div>

        <div class="p-stack">
          <label for="contact-email">E-mail</label>
          <input
            id="contact-email"
            v-model="form.email"
            type="email"
            required
          />
        </div>

        <div class="p-stack">
          <label for="contact-message">Zpráva</label>
          <textarea
            id="contact-message"
            v-model="form.message"
            rows="6"
            required
          ></textarea>
        </div>

        <button type="submit" :disabled="submitting">
          {{ submitting ? "Odesílám…" : "Odeslat zprávu" }}
        </button>
      </form>
    </section>
  </div>
</template>

<script setup lang="ts">
const { settings } = useSiteSettings()

useSeoMeta({
  title: "Kontakt — Čtyřiadvacítka",
  description: "Kontaktní údaje a formulář 24. oddílu Junáka Hradec Králové",
})

const form = ref({
  name: "",
  email: "",
  message: "",
})

const submitting = ref(false)
const successMessage = ref("")
const errorMessage = ref("")

async function handleSubmit() {
  submitting.value = true
  successMessage.value = ""
  errorMessage.value = ""

  try {
    await $fetch("/api/contact", {
      method: "POST",
      body: form.value,
    })
    successMessage.value = "Zpráva byla úspěšně odeslána. Děkujeme!"
    form.value = { name: "", email: "", message: "" }
  } catch {
    errorMessage.value =
      "Zprávu se nepodařilo odeslat. Zkontrolujte prosím vyplněné údaje."
  } finally {
    submitting.value = false
  }
}
</script>
