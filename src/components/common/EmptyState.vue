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
    <div class="slot">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.empty {
  text-align: center;
  padding: 1.5rem 1.1rem;
  border-style: dashed;
  background: linear-gradient(180deg, #fff 0%, var(--color-purple-soft) 140%);
}

.empty-title {
  font-size: 1.1rem;
  color: var(--color-purple-deep);
}

.slot {
  margin-top: 0.85rem;
  display: flex;
  justify-content: center;
}
</style>
