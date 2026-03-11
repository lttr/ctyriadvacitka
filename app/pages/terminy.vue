<template>
  <div class="p-stack">
    <h1>Termíny akcí</h1>
    <p>Schůzky jsou každé pondělí od 17:00 do 18:30.</p>
    <iframe
      v-if="calendarId"
      :src="calendarSrc"
      title="Kalendář akcí oddílu"
      width="100%"
      height="600"
      frameborder="0"
      style="border: 0"
    ></iframe>
    <p v-else>Kalendář není dostupný.</p>
  </div>
</template>

<script setup lang="ts">
const { settings } = useSiteSettings()

const calendarId = computed(() => settings.value.googleCalendarId || "")

const calendarSrc = computed(() => {
  if (!calendarId.value) {
    return ""
  }
  const encoded = encodeURIComponent(calendarId.value)
  return `https://calendar.google.com/calendar/embed?src=${encoded}&ctz=Europe%2FPrague`
})

useSeoMeta({
  title: "Termíny akcí — Čtyřiadvacítka",
  description: "Kalendář plánovaných akcí 24. oddílu Junáka Hradec Králové",
})
</script>
