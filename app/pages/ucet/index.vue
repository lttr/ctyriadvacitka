<template>
  <div class="p-stack">
    <h1>Můj účet</h1>

    <p v-if="successMessage" role="status">{{ successMessage }}</p>
    <p v-if="errorMessage" role="alert">{{ errorMessage }}</p>

    <form v-if="user" @submit.prevent="handleSubmit">
      <div class="p-stack">
        <label for="account-username">Přihlašovací jméno</label>
        <input
          id="account-username"
          v-model="form.username"
          type="text"
          required
        />
      </div>

      <div class="p-stack">
        <label for="account-name">Jméno</label>
        <input id="account-name" v-model="form.name" type="text" />
      </div>

      <div class="p-stack">
        <label for="account-surname">Příjmení</label>
        <input id="account-surname" v-model="form.surname" type="text" />
      </div>

      <div class="p-stack">
        <label for="account-nickname">Přezdívka</label>
        <input id="account-nickname" v-model="form.nickname" type="text" />
      </div>

      <div class="p-stack">
        <label for="account-email">E-mail</label>
        <input id="account-email" v-model="form.email" type="email" required />
      </div>

      <button type="submit" :disabled="submitting">
        {{ submitting ? "Ukládám…" : "Uložit" }}
      </button>
    </form>

    <p>
      <NuxtLink to="/ucet/zmenit-heslo">Změnit heslo</NuxtLink>
    </p>
    <p>
      <NuxtLink to="/odhlasit">Odhlásit</NuxtLink>
    </p>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: "auth",
})

useSeoMeta({
  title: "Můj účet — Čtyřiadvacítka",
})

const { data: userData, refresh } = await useFetch("/api/users/me")
const user = computed(() => userData.value?.user)

const form = ref({
  username: user.value?.username ?? "",
  name: user.value?.name ?? "",
  surname: user.value?.surname ?? "",
  nickname: user.value?.nickname ?? "",
  email: user.value?.email ?? "",
})

watch(user, (newUser) => {
  if (newUser) {
    form.value = {
      username: newUser.username,
      name: newUser.name ?? "",
      surname: newUser.surname ?? "",
      nickname: newUser.nickname ?? "",
      email: newUser.email ?? "",
    }
  }
})

const submitting = ref(false)
const successMessage = ref("")
const errorMessage = ref("")

async function handleSubmit() {
  submitting.value = true
  successMessage.value = ""
  errorMessage.value = ""

  try {
    await $fetch("/api/users/me", {
      method: "PUT",
      body: form.value,
    })
    successMessage.value = "Uživatel byl úspěšně editován."
    await refresh()
  } catch (error: unknown) {
    const fetchError = error as { data?: { message?: string } }
    errorMessage.value =
      fetchError.data?.message ?? "Nepodařilo se uložit změny."
  } finally {
    submitting.value = false
  }
}
</script>
