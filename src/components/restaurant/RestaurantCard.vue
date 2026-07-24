<script setup lang="ts">
import type { Restaurant } from '@/types/restaurant'
import { RESTAURANT_STATUS_LABELS } from '@/types/restaurant'

defineProps<{
  restaurant: Restaurant
  canEdit: boolean
}>()

const emit = defineEmits<{
  edit: []
  remove: []
}>()
</script>

<template>
  <article class="resto-card card">
    <div class="top">
      <span class="status" :data-status="restaurant.status">
        {{ RESTAURANT_STATUS_LABELS[restaurant.status] }}
      </span>
      <span v-if="restaurant.meal_type" class="meal">{{ restaurant.meal_type }}</span>
    </div>

    <h3 class="name">{{ restaurant.name }}</h3>
    <p v-if="restaurant.address" class="meta">{{ restaurant.address }}</p>
    <p v-if="restaurant.budget" class="meta">預算：{{ restaurant.budget }}</p>
    <p v-if="restaurant.note" class="note">{{ restaurant.note }}</p>

    <a
      v-if="restaurant.map_url"
      class="map-link"
      :href="restaurant.map_url"
      target="_blank"
      rel="noopener noreferrer"
    >
      開啟地圖
    </a>

    <div v-if="canEdit" class="actions">
      <button type="button" class="btn-text" @click="emit('edit')">編輯</button>
      <button type="button" class="btn-text danger" @click="emit('remove')">刪除</button>
    </div>
  </article>
</template>

<style scoped>
.resto-card {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.top {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-bottom: 0.25rem;
}

.status,
.meal {
  display: inline-flex;
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
}

.status {
  background: var(--color-purple-soft);
  color: var(--color-purple-deep);
}

.status[data-status='selected'] {
  background: var(--color-green-soft);
  color: var(--color-green-deep);
}

.status[data-status='rejected'] {
  background: var(--color-danger-soft);
  color: var(--color-danger);
}

.meal {
  background: var(--color-pink-soft);
  color: var(--color-pink-deep);
}

.name {
  margin: 0;
  font-size: 1.05rem;
}

.meta,
.note {
  margin: 0;
  font-size: 0.9rem;
}

.map-link {
  margin-top: 0.25rem;
  font-size: 0.85rem;
  font-weight: 600;
}

.actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 0.4rem;
}

.btn-text {
  min-height: 40px;
  padding: 0.25rem 0.1rem;
  border: none;
  background: transparent;
  color: var(--color-purple);
  font-weight: 700;
}

.btn-text.danger {
  color: var(--color-danger);
}
</style>
