<template>
  <div class="p-stack">
    <h1>Registrace</h1>

    <p v-if="successMessage" role="status">{{ successMessage }}</p>
    <p v-if="errorMessage" role="alert">{{ errorMessage }}</p>

    <form v-if="!successMessage" @submit.prevent="handleSubmit">
      <div class="p-stack">
        <label for="register-username">Uživatelské jméno</label>
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
        <label for="register-name">Jméno</label>
        <input id="register-name" v-model="form.name" type="text" />
      </div>

      <div class="p-stack">
        <label for="register-surname">Příjmení</label>
        <input id="register-surname" v-model="form.surname" type="text" />
      </div>

      <div class="p-stack">
        <label for="register-nickname">Přezdívka</label>
        <input id="register-nickname" v-model="form.nickname" type="text" />
      </div>

      <div class="p-stack">
        <label for="register-email">E-mail</label>
        <input id="register-email" v-model="form.email" type="email" />
      </div>

      <button type="submit" :disabled="submitting">
        {{ submitting ? "Registruji…" : "Zaregistrovat se" }}
      </button>
    </form>

    <p>
      Máte již účet?
      <NuxtLink to="/prihlaseni">Přihlaste se</NuxtLink>
    </p>
  </div>
</template>

<script setup lang="ts">
useSeoMeta({
  title: "Registrace — Čtyřiadvacítka",
})

const { register } = useAuth()

const form = ref({
  username: "",
  password: "",
  name: "",
  surname: "",
  nickname: "",
  email: "",
})

const submitting = ref(false)
const successMessage = ref("")
const errorMessage = ref("")

async function handleSubmit() {
  submitting.value = true
  successMessage.value = ""
  errorMessage.value = ""

  try {
    const body: Record<string, string> = {
      username: form.value.username,
      password: form.value.password,
    }
    if (form.value.name) {
      body.name = form.value.name
    }
    if (form.value.surname) {
      body.surname = form.value.surname
    }
    if (form.value.nickname) {
      body.nickname = form.value.nickname
    }
    if (form.value.email) {
      body.email = form.value.email
    }

    await register(body as Parameters<typeof register>[0])
    successMessage.value =
      "Registrace proběhla úspěšně. Nyní se můžete přihlásit."
  } catch (error: unknown) {
    const fetchError = error as { data?: { message?: string } }
    errorMessage.value =
      fetchError.data?.message ?? "Registrace se nezdařila. Zkuste to znovu."
  } finally {
    submitting.value = false
  }
}
</script>
