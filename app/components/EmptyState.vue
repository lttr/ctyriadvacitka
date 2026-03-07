<template>
  <div role="status" class="p-stack empty-state">
    <p v-if="heading" class="empty-state-heading">
      <strong>{{ heading }}</strong>
    </p>
    <p>{{ message }}</p>
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    message?: string
    heading?: string
  }>(),
  {
    message: "Žádné položky k zobrazení.",
    heading: undefined,
  },
)
</script>

<style scoped>
.empty-state {
  padding: var(--space-m, 1rem) 0;
}
</style>
