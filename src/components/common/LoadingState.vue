<script setup lang="ts">
defineProps<{
  message?: string
}>()
</script>

<template>
  <div class="loading" role="status">{{ message ?? '載入中…' }}</div>
</template>

<style scoped>
.loading {
  padding: 1.5rem 0;
  text-align: center;
  color: var(--color-text-muted);
}
</style>
