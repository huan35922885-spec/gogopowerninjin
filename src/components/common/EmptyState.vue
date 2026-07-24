<script setup lang="ts">
defineProps<{
  title: string
  description?: string
}>()
</script>

<template>
  <div class="empty card">
    <h2 class="empty-title">{{ title }}</h2>
    <p v-if="description">{{ description }}</p>
    <slot />
  </div>
</template>

<style scoped>
.empty-title {
  font-size: 1.1rem;
}
</style>
