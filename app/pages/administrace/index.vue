<template>
  <div class="p-stack">
    <h1>Vítejte v administraci</h1>

    <div v-if="stats" class="p-cluster">
      <NuxtLink to="/administrace/clanky" class="p-card">
        <strong>{{ stats.articleCount }}</strong>
        <span>Články</span>
      </NuxtLink>
      <NuxtLink to="/administrace/novinky" class="p-card">
        <strong>{{ stats.newsCount }}</strong>
        <span>Novinky</span>
      </NuxtLink>
      <NuxtLink to="/administrace/uzivatele" class="p-card">
        <strong>{{ stats.userCount }}</strong>
        <span>Uživatelé</span>
      </NuxtLink>
    </div>

    <section class="p-stack">
      <h2>Nastavení webu</h2>

      <form class="p-stack" @submit.prevent="saveWebSettings">
        <div>
          <label for="webName">Jméno webu</label>
          <input id="webName" v-model="webForm.siteName" type="text" required />
        </div>

        <div>
          <label for="webDescription">Popis webu</label>
          <input
            id="webDescription"
            v-model="webForm.siteDescription"
            type="text"
            required
          />
        </div>

        <div>
          <label for="contactEmail">E-maily pro kontaktní formulář</label>
          <input
            id="contactEmail"
            v-model="webForm.contactEmail"
            type="text"
            required
          />
        </div>

        <div>
          <button type="submit" :disabled="savingWeb">
            {{ savingWeb ? "Ukládám…" : "Uložit" }}
          </button>
        </div>

        <p v-if="webMessage" role="status">{{ webMessage }}</p>
      </form>
    </section>

    <section class="p-stack">
      <h2>Vedení oddílu</h2>

      <div v-for="(person, index) of persons" :key="index" class="p-stack">
        <fieldset class="p-stack">
          <legend>Osoba {{ index + 1 }}</legend>

          <div>
            <label :for="`person-name-${index}`">Jméno</label>
            <input
              :id="`person-name-${index}`"
              v-model="person.name"
              type="text"
              required
            />
          </div>

          <div>
            <label :for="`person-role-${index}`">Role</label>
            <input
              :id="`person-role-${index}`"
              v-model="person.role"
              type="text"
              required
            />
          </div>

          <div>
            <label :for="`person-nickname-${index}`">Přezdívka</label>
            <input
              :id="`person-nickname-${index}`"
              v-model="person.nickname"
              type="text"
            />
          </div>

          <div>
            <label :for="`person-phone-${index}`">Telefon</label>
            <input
              :id="`person-phone-${index}`"
              v-model="person.phone"
              type="tel"
            />
          </div>

          <div>
            <label :for="`person-email-${index}`">E-mail</label>
            <input
              :id="`person-email-${index}`"
              v-model="person.email"
              type="email"
            />
          </div>

          <div>
            <label :for="`person-photo-${index}`">Foto (název souboru)</label>
            <input
              :id="`person-photo-${index}`"
              v-model="person.photo"
              type="text"
            />
          </div>

          <div>
            <button type="button" @click="removePerson(index)">
              Odebrat osobu
            </button>
          </div>
        </fieldset>
      </div>

      <div>
        <button type="button" @click="addPerson">Přidat osobu</button>
      </div>

      <div>
        <button type="button" :disabled="savingPersons" @click="savePersons">
          {{ savingPersons ? "Ukládám…" : "Uložit vedení" }}
        </button>
      </div>

      <p v-if="personsMessage" role="status">{{ personsMessage }}</p>
    </section>
  </div>
</template>

<script setup lang="ts">
import type { ContactPerson } from "~~/shared/types/contact"

definePageMeta({
  layout: "admin",
  middleware: "admin-only",
})

useSeoMeta({
  title: "Administrace webu — Čtyřiadvacítka",
})

const { data: stats } = await useFetch("/api/admin/stats")
const { settings } = useSiteSettings()

const webForm = reactive({
  siteName: settings.value.siteName,
  siteDescription: settings.value.siteDescription,
  contactEmail: settings.value.contactEmail,
})

const savingWeb = ref(false)
const webMessage = ref("")

async function saveWebSettings() {
  savingWeb.value = true
  webMessage.value = ""

  try {
    await $fetch("/api/settings", {
      method: "PUT",
      body: {
        siteName: webForm.siteName,
        siteDescription: webForm.siteDescription,
        contactEmail: webForm.contactEmail,
      },
    })
    webMessage.value = "Údaje byly upraveny."
  } catch {
    webMessage.value = "Nepodařilo se uložit nastavení."
  } finally {
    savingWeb.value = false
  }
}

const persons = ref<ContactPerson[]>([...settings.value.contactInfo])
const savingPersons = ref(false)
const personsMessage = ref("")

function addPerson() {
  persons.value.push({
    name: "",
    role: "",
    nickname: "",
    phone: "",
    email: "",
    photo: "",
  })
}

function removePerson(index: number) {
  persons.value.splice(index, 1)
}

async function savePersons() {
  savingPersons.value = true
  personsMessage.value = ""

  try {
    await $fetch("/api/settings", {
      method: "PUT",
      body: {
        contactInfo: JSON.stringify(persons.value),
      },
    })
    personsMessage.value = "Kontaktní údaje byly upraveny."
  } catch {
    personsMessage.value = "Nepodařilo se uložit vedení oddílu."
  } finally {
    savingPersons.value = false
  }
}
</script>
