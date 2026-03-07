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
    personsMessage.value = "Vedení oddílu bylo uloženo."
  } catch {
    personsMessage.value = "Nepodařilo se uložit vedení oddílu."
  } finally {
    savingPersons.value = false
  }
}
</script>
