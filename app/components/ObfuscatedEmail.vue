<template>
  <span ref="emailRef" class="p-obfuscated-email"></span>
</template>

<script setup lang="ts">
const { email } = defineProps<{
  email: string
}>()

const emailRef = ref<HTMLSpanElement | null>(null)

onMounted(() => {
  if (emailRef.value && email) {
    const link = document.createElement("a")
    link.href = `mailto:${email}`
    link.textContent = email
    emailRef.value.appendChild(link)
  }
})
</script>
