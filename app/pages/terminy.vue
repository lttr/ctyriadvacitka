<template>
  <div class="p-stack">
    <h1>Termíny akcí</h1>
    <p>Kalendář plánovaných akcí oddílu.</p>
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
const { data: settings } = await useFetch("/api/settings")

const calendarId = computed(
  () => (settings.value as Record<string, string> | null)?.googleCalendarId,
)

const calendarSrc = computed(() => {
  if (!calendarId.value) {
    return ""
  }
  const encoded = encodeURIComponent(calendarId.value)
  return `https://calendar.google.com/calendar/embed?src=${encoded}&ctz=Europe%2FPrague`
})
</script>
