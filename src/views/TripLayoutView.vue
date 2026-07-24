<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const tripId = computed(() => String(route.params.tripId))
</script>

<template>
  <div class="trip-layout">
    <nav class="trip-nav" aria-label="旅行子頁面">
      <RouterLink :to="`/trips/${tripId}`">概覽</RouterLink>
      <RouterLink :to="`/trips/${tripId}/itinerary`">行程</RouterLink>
      <RouterLink :to="`/trips/${tripId}/restaurants`">餐廳</RouterLink>
      <RouterLink :to="`/trips/${tripId}/checklist`">行李</RouterLink>
      <RouterLink :to="`/trips/${tripId}/members`">成員</RouterLink>
    </nav>
    <RouterView />
  </div>
</template>

<style scoped>
.trip-layout {
  display: flex;
  flex-direction: column;
}

.trip-nav {
  display: flex;
  gap: 0.25rem;
  overflow-x: auto;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--color-border);
  background: rgba(255, 255, 255, 0.7);
  -webkit-overflow-scrolling: touch;
}

.trip-nav a {
  flex-shrink: 0;
  color: var(--color-text-muted);
  text-decoration: none;
  padding: 0.5rem 0.75rem;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  border-radius: 8px;
  font-size: 0.9rem;
}

.trip-nav a.router-link-active {
  background: var(--color-primary-soft);
  color: var(--color-primary);
  font-weight: 600;
}
</style>
