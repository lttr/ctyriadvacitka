<template>
  <div>
    <h1>Uživatelé</h1>

    <div v-if="users && users.length > 0" class="p-stack">
      <table>
        <thead>
          <tr>
            <th>Uživatelské jméno</th>
            <th>Jméno</th>
            <th>E-mail</th>
            <th>Role</th>
            <th>Akce</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user of users" :key="user.id">
            <td>{{ user.username }}</td>
            <td>
              {{ [user.name, user.surname].filter(Boolean).join(" ") || "—" }}
            </td>
            <td>{{ user.email || "—" }}</td>
            <td>
              <label :for="`role-${user.username}`" class="sr-only">
                Role uživatele {{ user.username }}
              </label>
              <select
                :id="`role-${user.username}`"
                :value="user.role"
                :disabled="user.username === currentUsername"
                @change="
                  changeRole(
                    user.username,
                    ($event.target as HTMLSelectElement).value,
                  )
                "
              >
                <option value="registered">Registrovaný</option>
                <option value="editor">Editor</option>
                <option value="admin">Administrátor</option>
              </select>
            </td>
            <td>
              <button
                v-if="user.username !== currentUsername"
                type="button"
                @click="deleteUser(user.username)"
              >
                Smazat
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <p v-else-if="users">Žádní uživatelé.</p>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: "admin",
  middleware: "admin",
})

useSeoMeta({
  title: "Uživatelé — Administrace — Čtyřiadvacítka",
})

const { data: session } = await useFetch("/api/auth/session")
const currentUsername = computed(() => session.value?.user?.username)

const { data: users, refresh } = await useFetch("/api/users")

async function changeRole(username: string, role: string) {
  await $fetch(`/api/users/${username}/role`, {
    method: "PATCH",
    body: { role },
  })
  await refresh()
}

async function deleteUser(username: string) {
  if (!confirm(`Opravdu smazat uživatele "${username}"?`)) {
    return
  }
  await $fetch(`/api/users/${username}`, {
    method: "DELETE",
  })
  await refresh()
}
</script>
