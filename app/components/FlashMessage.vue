<template>
  <div
    v-if="message"
    class="flash-message"
    :class="`flash-${type}`"
    role="status"
  >
    <span>{{ message }}</span>
    <button
      type="button"
      class="flash-close"
      aria-label="Zavřít"
      @click="clear"
    >
      &times;
    </button>
  </div>
</template>

<script setup lang="ts">
const { message, type, clear } = useFlashMessage()
</script>

<style scoped>
.flash-message {
  padding: var(--space-xs, 0.5rem) var(--space-s, 0.75rem);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-xs, 0.5rem);
}

.flash-success {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.flash-error {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.flash-info {
  background-color: #d1ecf1;
  color: #0c5460;
  border: 1px solid #bee5eb;
}

.flash-close {
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  color: inherit;
  padding: 0;
  line-height: 1;
}
</style>
