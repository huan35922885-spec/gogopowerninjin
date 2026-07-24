<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const tripId = computed(() => String(route.params.tripId))

const links = computed(() => [
  { to: `/trips/${tripId.value}`, label: '概覽' },
  { to: `/trips/${tripId.value}/itinerary`, label: '行程' },
  { to: `/trips/${tripId.value}/restaurants`, label: '餐廳' },
  { to: `/trips/${tripId.value}/polls`, label: '投票' },
  { to: `/trips/${tripId.value}/checklist`, label: '行李' },
  { to: `/trips/${tripId.value}/members`, label: '成員' },
])
</script>

<template>
  <div class="trip-layout">
    <aside class="trip-sidebar">
      <p class="sidebar-label">此趟旅行</p>
      <nav class="trip-nav" aria-label="旅行子頁面">
        <RouterLink
          v-for="link in links"
          :key="link.to"
          class="trip-link"
          active-class=""
          exact-active-class="is-active"
          :to="link.to"
        >
          {{ link.label }}
        </RouterLink>
      </nav>
    </aside>
    <div class="trip-main">
      <RouterView />
    </div>
  </div>
</template>

<style scoped>
.trip-layout {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 72rem;
  margin: 0 auto;
  min-height: calc(100vh - var(--header-height));
}

.trip-sidebar {
  position: sticky;
  top: var(--header-height);
  z-index: 5;
  background: rgba(255, 255, 255, 0.88);
  border-bottom: 1px solid var(--color-border);
  backdrop-filter: blur(10px);
}

.sidebar-label {
  display: none;
}

.trip-nav {
  display: flex;
  gap: 0.35rem;
  overflow-x: auto;
  padding: 0.65rem 1rem;
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

.trip-main {
  flex: 1;
  min-width: 0;
}

.trip-main :deep(.page) {
  max-width: 56rem;
}

@media (min-width: 860px) {
  .trip-layout {
    display: grid;
    grid-template-columns: 12.5rem minmax(0, 1fr);
    gap: 0 1.5rem;
    padding: 1.25rem 1.5rem 2rem;
    align-items: start;
  }

  .trip-sidebar {
    position: sticky;
    top: calc(var(--header-height) + 1rem);
    border: 1px solid var(--color-border);
    border-radius: var(--radius);
    background: rgba(255, 255, 255, 0.94);
    box-shadow: var(--shadow);
    padding: 1rem 0.75rem;
    backdrop-filter: blur(10px);
  }

  .sidebar-label {
    display: block;
    margin: 0 0.5rem 0.65rem;
    font-size: 0.75rem;
    font-weight: 800;
    letter-spacing: 0.06em;
    color: var(--color-purple);
  }

  .trip-nav {
    flex-direction: column;
    overflow: visible;
    padding: 0;
    gap: 0.25rem;
  }

  .trip-link {
    width: 100%;
    border-radius: var(--radius-sm);
    padding: 0.65rem 0.85rem;
  }

  .trip-link.is-active {
    box-shadow: inset 3px 0 0 var(--color-purple);
  }

  .trip-main :deep(.page) {
    max-width: none;
    padding-left: 0.35rem;
    padding-right: 0.35rem;
  }
}

@media (min-width: 1100px) {
  .trip-layout {
    grid-template-columns: 13.5rem minmax(0, 1fr);
    max-width: 78rem;
    gap: 0 2rem;
  }
}
</style>
