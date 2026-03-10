<template>
  <nav class="p-navbar" aria-label="Hlavní navigace">
    <div class="p-navbar-brand">
      <NuxtLink to="/" class="p-navbar-item">
        <strong>Čtyřiadvacítka</strong>
      </NuxtLink>
      <button
        class="p-navbar-burger"
        :class="{ 'is-active': menuOpen }"
        type="button"
        aria-label="menu"
        :aria-expanded="menuOpen"
        @click="menuOpen = !menuOpen"
      >
        <span aria-hidden="true"></span>
        <span aria-hidden="true"></span>
        <span aria-hidden="true"></span>
      </button>
    </div>
    <div class="p-navbar-menu" :class="{ 'is-active': menuOpen }">
      <NuxtLink to="/" class="p-navbar-item" @click="menuOpen = false">
        Novinky
      </NuxtLink>
      <NuxtLink to="/terminy" class="p-navbar-item" @click="menuOpen = false">
        Termíny
      </NuxtLink>
      <NuxtLink
        v-for="article of menuArticles"
        :key="article.id"
        :to="`/${article.url}`"
        class="p-navbar-item"
        @click="menuOpen = false"
      >
        {{ article.title }}
      </NuxtLink>
      <NuxtLink to="/kontakt" class="p-navbar-item" @click="menuOpen = false">
        Kontakty
      </NuxtLink>
    </div>
  </nav>
</template>

<script setup lang="ts">
const { data: menuArticles } = await useFetch("/api/articles/menu")

const menuOpen = ref(false)
</script>

<style scoped>
.p-navbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
}

.p-navbar-brand {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.p-navbar-burger {
  display: block;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
}

.p-navbar-burger span {
  display: block;
  width: 1.25rem;
  height: 2px;
  background: currentColor;
  margin: 4px 0;
}

.p-navbar-menu {
  display: none;
  width: 100%;
  flex-direction: column;
}

.p-navbar-menu.is-active {
  display: flex;
}

.p-navbar-item {
  padding: 0.25rem 0;
}

@media (min-width: 768px) {
  .p-navbar-brand {
    width: auto;
  }

  .p-navbar-burger {
    display: none;
  }

  .p-navbar-menu {
    display: flex;
    width: auto;
    flex-direction: row;
    gap: 1rem;
  }
}
</style>
