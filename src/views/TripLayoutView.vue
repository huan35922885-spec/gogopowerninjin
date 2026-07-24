<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const tripId = computed(() => String(route.params.tripId))
</script>

<template>
  <div class="trip-layout">
    <nav class="trip-nav" aria-label="旅行子頁面">
      <RouterLink
        class="trip-link"
        active-class=""
        exact-active-class="is-active"
        :to="`/trips/${tripId}`"
      >
        概覽
      </RouterLink>
      <RouterLink
        class="trip-link"
        active-class=""
        exact-active-class="is-active"
        :to="`/trips/${tripId}/itinerary`"
      >
        行程
      </RouterLink>
      <RouterLink
        class="trip-link"
        active-class=""
        exact-active-class="is-active"
        :to="`/trips/${tripId}/restaurants`"
      >
        餐廳
      </RouterLink>
      <RouterLink
        class="trip-link"
        active-class=""
        exact-active-class="is-active"
        :to="`/trips/${tripId}/checklist`"
      >
        行李
      </RouterLink>
      <RouterLink
        class="trip-link"
        active-class=""
        exact-active-class="is-active"
        :to="`/trips/${tripId}/members`"
      >
        成員
      </RouterLink>
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
  gap: 0.35rem;
  overflow-x: auto;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--color-border);
  background: rgba(255, 255, 255, 0.72);
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.trip-nav::-webkit-scrollbar {
  display: none;
}

.trip-link {
  flex-shrink: 0;
  color: var(--color-text-muted);
  text-decoration: none;
  padding: 0.45rem 0.85rem;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  border-radius: var(--radius-pill);
  font-size: 0.9rem;
  font-weight: 700;
}

.trip-link:hover {
  text-decoration: none;
  background: var(--color-pink-soft);
  color: var(--color-pink-deep);
}

.trip-link.is-active {
  background: var(--color-purple-soft);
  color: var(--color-purple-deep);
}
</style>
