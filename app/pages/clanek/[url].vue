<script setup lang="ts">
const route = useRoute("clanek-url")
const url = route.params.url
await navigateTo(`/${url}`, { redirectCode: 301 })
</script>
