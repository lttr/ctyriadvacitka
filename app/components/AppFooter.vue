<template>
  <footer class="p-footer">
    <div class="p-footer-columns">
      <div class="p-footer-column">
        <h4>Čtyřiadvacítka</h4>
        <ul>
          <li><NuxtLink to="/">Novinky</NuxtLink></li>
          <li><NuxtLink to="/terminy">Termíny</NuxtLink></li>
          <li v-for="article of menuArticles" :key="article.id">
            <NuxtLink :to="`/${article.url}`">{{ article.title }}</NuxtLink>
          </li>
          <li><NuxtLink to="/kontakt">Kontakty</NuxtLink></li>
        </ul>
      </div>
      <div class="p-footer-column">
        <h4>Organizace</h4>
        <ul>
          <li>
            <a href="https://www.skaut.cz" target="_blank" rel="noopener">
              Junák
            </a>
          </li>
          <li>
            <a href="https://hk.skauting.cz" target="_blank" rel="noopener">
              Skaut HK
            </a>
          </li>
        </ul>
      </div>
      <div class="p-footer-column">
        <h4>Administrace</h4>
        <ul v-if="isLoggedIn">
          <li><NuxtLink to="/ucet">Můj účet</NuxtLink></li>
          <li v-if="isEditor">
            <NuxtLink to="/administrace">Administrace</NuxtLink>
          </li>
          <li><NuxtLink to="/odhlasit">Odhlásit</NuxtLink></li>
        </ul>
        <ul v-else>
          <li><NuxtLink to="/prihlaseni">Přihlásit</NuxtLink></li>
          <li><NuxtLink to="/registrace">Registrovat</NuxtLink></li>
        </ul>
      </div>
    </div>
    <p class="p-footer-copyright">
      © {{ currentYear }} 24. oddíl Junáka Hradec Králové
    </p>
  </footer>
</template>

<script setup lang="ts">
const { isLoggedIn, isEditor } = useAuth()
const { data: menuArticles } = await useFetch("/api/articles/menu")

const currentYear = new Date().getFullYear()
</script>

<style scoped>
.p-footer-columns {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

@media (min-width: 768px) {
  .p-footer-columns {
    grid-template-columns: 1fr 1fr 1fr;
  }
}

.p-footer-column ul {
  list-style: none;
  padding: 0;
}

.p-footer-column h4 {
  margin-bottom: 0.5rem;
}

.p-footer-copyright {
  margin-top: 1.5rem;
  text-align: center;
}
</style>
