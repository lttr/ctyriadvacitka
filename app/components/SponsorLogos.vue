<template>
  <section class="p-sponsors" aria-label="Sponzoři">
    <div class="p-sponsors-row">
      <img
        src="/img/logo-khk.gif"
        alt="Královéhradecký kraj"
        width="193"
        height="92"
      />
      <img
        src="/img/logo-hk.png"
        alt="Město Hradec Králové"
        width="180"
        height="96"
      />
      <img
        src="/img/logo-nadace.png"
        alt="Nadace ČEZ"
        width="180"
        height="100"
      />
    </div>
  </section>
</template>

<style scoped>
.p-sponsors {
  padding: 2rem 0;
}

.p-sponsors-row {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 2rem;
  flex-wrap: wrap;
}

.p-sponsors-row img {
  max-width: 100%;
  height: auto;
}
</style>
