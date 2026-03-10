<template>
  <div class="p-stack">
    <h1>Kontakt</h1>

    <section class="p-stack">
      <h2>Napište nám</h2>

      <p v-if="successMessage" role="status">{{ successMessage }}</p>
      <p v-if="errorMessage" role="alert">{{ errorMessage }}</p>

      <form @submit.prevent="handleSubmit">
        <div class="p-stack">
          <label for="contact-name">Vaše jméno</label>
          <input id="contact-name" v-model="form.name" type="text" required />
        </div>

        <div class="p-stack">
          <label for="contact-email">Email</label>
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
            placeholder="Vaše zpráva"
          ></textarea>
        </div>

        <button type="submit" :disabled="submitting">
          {{ submitting ? "Odesílám…" : "Odeslat" }}
        </button>
      </form>
    </section>

    <section v-if="settings.contactInfo.length > 0" class="p-stack">
      <h2>Vedení oddílu</h2>
      <div class="p-leader-cards">
        <div
          v-for="person of settings.contactInfo"
          :key="person.name"
          class="p-leader-card"
        >
          <img
            v-if="person.photo"
            :src="`/img/contact-photos/${person.photo}`"
            :alt="person.name"
            class="p-leader-photo"
            width="180"
            height="180"
          />
          <h3>{{ person.name }}</h3>
          <p v-if="person.nickname" class="p-leader-nickname">
            {{ person.nickname }}
          </p>
          <p v-if="person.role" class="p-leader-role">{{ person.role }}</p>
          <p v-if="person.phone">
            <a :href="`tel:${person.phone}`">{{ person.phone }}</a>
          </p>
          <p v-if="person.email">
            <ObfuscatedEmail :email="person.email" />
          </p>
        </div>
      </div>
    </section>

    <section class="p-stack">
      <h2>Kontaktní údaje</h2>
      <dl v-if="settings">
        <dt>E-mail</dt>
        <dd>
          <ObfuscatedEmail :email="settings.contactEmail" />
        </dd>
        <dt>Telefon</dt>
        <dd>{{ settings.contactPhone }}</dd>
        <dt>Adresa</dt>
        <dd>{{ settings.contactAddress }}</dd>
      </dl>
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
    successMessage.value = "E-mail byl úspěšně odeslán."
    form.value = { name: "", email: "", message: "" }
  } catch {
    errorMessage.value = "E-mail se nepodařilo odeslat."
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.p-leader-cards {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
}

@media (min-width: 768px) {
  .p-leader-cards {
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  }
}

.p-leader-card {
  text-align: center;
}

.p-leader-photo {
  border-radius: 50%;
  object-fit: cover;
  margin-bottom: 0.5rem;
}

.p-leader-nickname {
  font-style: italic;
}

.p-leader-role {
  color: #666;
  font-size: 0.9rem;
}
</style>
