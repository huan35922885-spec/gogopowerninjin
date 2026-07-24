<script setup lang="ts">
defineProps<{
  message?: string
}>()
</script>

<template>
  <div class="loading" role="status">
    <span class="dot" />
    <span>{{ message ?? '載入中…' }}</span>
  </div>
</template>

<style scoped>
.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.55rem;
  padding: 1.75rem 0;
  color: var(--color-purple);
  font-weight: 700;
}

.dot {
  width: 0.7rem;
  height: 0.7rem;
  border-radius: 50%;
  background: var(--color-pink);
  animation: pulse 0.9s ease infinite alternate;
}

@keyframes pulse {
  from {
    transform: scale(0.85);
    background: var(--color-pink);
  }
  to {
    transform: scale(1.15);
    background: var(--color-purple);
  }
}

@media (prefers-reduced-motion: reduce) {
  .dot {
    animation: none;
  }
}
</style>
