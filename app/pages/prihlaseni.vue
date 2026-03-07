<template>
  <div class="p-stack">
    <h1>Přihlášení</h1>

    <p v-if="errorMessage" role="alert">{{ errorMessage }}</p>

    <form @submit.prevent="handleSubmit">
      <div class="p-stack">
        <label for="login-username">Uživatelské jméno</label>
        <input
          id="login-username"
          v-model="form.username"
          type="text"
          required
          autocomplete="username"
        />
      </div>

      <div class="p-stack">
        <label for="login-password">Heslo</label>
        <input
          id="login-password"
          v-model="form.password"
          type="password"
          required
          autocomplete="current-password"
        />
      </div>

      <button type="submit" :disabled="submitting">
        {{ submitting ? "Přihlašuji…" : "Přihlásit se" }}
      </button>
    </form>

    <p>
      Nemáte účet?
      <NuxtLink to="/registrace">Zaregistrujte se</NuxtLink>
    </p>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: "guest",
})

useSeoMeta({
  title: "Přihlášení — Čtyřiadvacítka",
})

const { login, fetchSession } = useAuth()

const form = ref({
  username: "",
  password: "",
})

const submitting = ref(false)
const errorMessage = ref("")

async function handleSubmit() {
  submitting.value = true
  errorMessage.value = ""

  try {
    await login(form.value.username, form.value.password)
    await fetchSession()
    await navigateTo("/")
  } catch (error: unknown) {
    const fetchError = error as { data?: { message?: string } }
    errorMessage.value =
      fetchError.data?.message ??
      "Přihlášení se nezdařilo. Zkontrolujte prosím údaje."
  } finally {
    submitting.value = false
  }
}
</script>
