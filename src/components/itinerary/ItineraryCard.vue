<script setup lang="ts">
import type { ItineraryItem } from '@/types/itinerary'
import { formatTime } from '@/utils/itineraryHelpers'

defineProps<{
  item: ItineraryItem
  canEdit: boolean
}>()

const emit = defineEmits<{
  edit: []
  remove: []
}>()
</script>

<template>
  <article class="itin-card">
    <div class="time-col">
      <span class="time">
        {{ formatTime(item.start_time) || '未定' }}
      </span>
      <span v-if="item.end_time" class="time-end">～ {{ formatTime(item.end_time) }}</span>
    </div>

    <div class="content">
      <div class="top">
        <span class="category">{{ item.category }}</span>
        <h3 class="title">{{ item.title }}</h3>
      </div>
      <p v-if="item.location" class="location">{{ item.location }}</p>
      <p v-if="item.description" class="desc">{{ item.description }}</p>
      <a
        v-if="item.map_url"
        class="map-link"
        :href="item.map_url"
        target="_blank"
        rel="noopener noreferrer"
      >
        開啟地圖
      </a>

      <div v-if="canEdit" class="actions">
        <button type="button" class="btn-text" @click="emit('edit')">編輯</button>
        <button type="button" class="btn-text danger" @click="emit('remove')">刪除</button>
      </div>
    </div>
  </article>
</template>

<style scoped>
.itin-card {
  display: grid;
  grid-template-columns: 4.5rem 1fr;
  gap: 0.75rem;
  padding: 0.85rem 0;
}

.time-col {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  padding-top: 0.15rem;
}

.time {
  font-weight: 700;
  font-size: 0.9rem;
  color: var(--color-primary);
}

.time-end {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.content {
  min-width: 0;
}

.top {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.category {
  display: inline-flex;
  align-self: flex-start;
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  background: var(--color-primary-soft);
  color: var(--color-primary);
  font-size: 0.75rem;
  font-weight: 600;
}

.title {
  margin: 0;
  font-size: 1rem;
}

.location,
.desc {
  margin: 0.35rem 0 0;
  font-size: 0.9rem;
}

.map-link {
  display: inline-block;
  margin-top: 0.4rem;
  font-size: 0.85rem;
  font-weight: 600;
}

.actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.btn-text {
  min-height: 40px;
  padding: 0.25rem 0.1rem;
  border: none;
  background: transparent;
  color: var(--color-primary);
  font-weight: 600;
}

.btn-text.danger {
  color: var(--color-danger);
}
</style>
