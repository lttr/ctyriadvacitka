<template>
  <section
    class="p-hero"
    :style="
      heroImage?.url ? { backgroundImage: `url(${heroImage.url})` } : undefined
    "
  >
    <div class="p-hero-overlay">
      <p class="p-hero-subtitle">Skautský oddíl</p>
      <h1 class="p-hero-title">Čtyřiadvacítka</h1>
    </div>
  </section>
</template>

<script setup lang="ts">
const { data: heroImage } = await useFetch("/api/header-images/random")
</script>

<style scoped>
.p-hero {
  width: 100%;
  min-height: 200px;
  background-color: #2c3e50;
  background-size: cover;
  background-position: center;
  position: relative;
}

.p-hero-overlay {
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  text-align: center;
  color: white;
}

.p-hero-subtitle {
  font-size: 1.1rem;
  margin: 0 0 0.25rem;
  opacity: 0.9;
}

.p-hero-title {
  font-size: 2.5rem;
  margin: 0;
  font-weight: bold;
}

@media (min-width: 768px) {
  .p-hero {
    min-height: 300px;
    clip-path: polygon(0 0, 100% 0, 100% 85%, 0 100%);
  }

  .p-hero-overlay {
    padding: 4rem 1rem 5rem;
  }

  .p-hero-title {
    font-size: 3rem;
  }
}
</style>
