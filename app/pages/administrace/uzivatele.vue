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
              <div class="role-buttons">
                <button
                  v-for="role of roles"
                  :key="role.value"
                  type="button"
                  class="role-button"
                  :class="{ active: user.role === role.value }"
                  :disabled="user.username === currentUsername"
                  @click="changeRole(user.username, role.value)"
                >
                  {{ role.label }}
                </button>
              </div>
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

const roles = [
  { value: "registered", label: "Uživatel" },
  { value: "editor", label: "Redaktor" },
  { value: "admin", label: "Administrátor" },
]

const { show } = useFlashMessage()

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
  show("Uživatel byl úspěšně odstraněn.")
  await refresh()
}
</script>

<style scoped>
.role-buttons {
  display: flex;
  gap: 0;
}

.role-button {
  padding: 0.25em 0.5em;
  border: 1px solid var(--color-border, #ccc);
  background: transparent;
  cursor: pointer;
}

.role-button + .role-button {
  border-left: 0;
}

.role-button.active {
  background-color: var(--color-success, #4caf50);
  color: white;
  border-color: var(--color-success, #4caf50);
}

.role-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
