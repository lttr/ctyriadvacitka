<template>
  <div class="p-stack">
    <h1>Změna hesla</h1>

    <p v-if="successMessage" role="status">{{ successMessage }}</p>
    <p v-if="errorMessage" role="alert">{{ errorMessage }}</p>

    <form @submit.prevent="handleSubmit">
      <div class="p-stack">
        <label for="current-password">Aktuální heslo</label>
        <input
          id="current-password"
          v-model="form.currentPassword"
          type="password"
          required
        />
      </div>

      <div class="p-stack">
        <label for="new-password">Nové heslo</label>
        <input
          id="new-password"
          v-model="form.newPassword"
          type="password"
          required
          minlength="6"
        />
      </div>

      <div class="p-stack">
        <label for="new-password-again">Nové heslo znovu</label>
        <input
          id="new-password-again"
          v-model="form.newPasswordAgain"
          type="password"
          required
        />
      </div>

      <button type="submit" :disabled="submitting">
        {{ submitting ? "Měním heslo…" : "Změnit heslo" }}
      </button>
    </form>

    <p>
      <NuxtLink to="/ucet">Zpět na účet</NuxtLink>
    </p>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: "auth",
})

useSeoMeta({
  title: "Změna hesla — Čtyřiadvacítka",
})

const form = ref({
  currentPassword: "",
  newPassword: "",
  newPasswordAgain: "",
})

const submitting = ref(false)
const successMessage = ref("")
const errorMessage = ref("")

async function handleSubmit() {
  if (form.value.newPassword !== form.value.newPasswordAgain) {
    errorMessage.value = "Hesla se neschodují!"
    return
  }

  submitting.value = true
  successMessage.value = ""
  errorMessage.value = ""

  try {
    await $fetch("/api/users/me/password", {
      method: "PUT",
      body: form.value,
    })
    successMessage.value = "Heslo bylo úspěšně změněno."
    form.value = { currentPassword: "", newPassword: "", newPasswordAgain: "" }
  } catch (error: unknown) {
    const fetchError = error as { data?: { message?: string } }
    errorMessage.value =
      fetchError.data?.message ?? "Nepodařilo se změnit heslo."
  } finally {
    submitting.value = false
  }
}
</script>
