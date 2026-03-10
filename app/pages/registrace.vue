<template>
  <div class="p-stack">
    <h1>Registrace</h1>

    <p v-if="successMessage" role="status">{{ successMessage }}</p>
    <p v-if="errorMessage" role="alert">{{ errorMessage }}</p>

    <form v-if="!successMessage" @submit.prevent="handleSubmit">
      <div class="p-stack">
        <label for="register-username">Přihlašovací jméno</label>
        <input
          id="register-username"
          v-model="form.username"
          type="text"
          required
          minlength="3"
          maxlength="50"
          autocomplete="username"
        />
      </div>

      <div class="p-stack">
        <label for="register-password">Heslo</label>
        <input
          id="register-password"
          v-model="form.password"
          type="password"
          required
          minlength="6"
          maxlength="100"
          autocomplete="new-password"
        />
      </div>

      <div class="p-stack">
        <label for="register-password-again">Heslo znovu</label>
        <input
          id="register-password-again"
          v-model="form.passwordAgain"
          type="password"
          required
          autocomplete="new-password"
        />
      </div>

      <div class="p-stack">
        <label for="register-email">E-mail</label>
        <input id="register-email" v-model="form.email" type="email" required />
      </div>

      <button type="submit" :disabled="submitting">
        {{ submitting ? "Registruji…" : "Registrovat" }}
      </button>
    </form>

    <p>
      Máte již účet?
      <NuxtLink to="/prihlaseni">Přihlaste se</NuxtLink>
    </p>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: "guest",
})

useSeoMeta({
  title: "Registrace — Čtyřiadvacítka",
})

const { register } = useAuth()

const form = ref({
  username: "",
  password: "",
  passwordAgain: "",
  email: "",
})

const submitting = ref(false)
const successMessage = ref("")
const errorMessage = ref("")

async function handleSubmit() {
  if (form.value.password !== form.value.passwordAgain) {
    errorMessage.value = "Hesla se neschodují!"
    return
  }

  submitting.value = true
  successMessage.value = ""
  errorMessage.value = ""

  try {
    await register({
      username: form.value.username,
      password: form.value.password,
      email: form.value.email,
    })
    successMessage.value = "Registrace proběhla úspěšně, nyní se přihlašte."
  } catch (error: unknown) {
    const fetchError = error as { data?: { message?: string } }
    errorMessage.value =
      fetchError.data?.message ??
      "Uživatel s tímto přihlašovacím jménem nebo e-mailem již existuje."
  } finally {
    submitting.value = false
  }
}
</script>
