<script setup lang="ts">
import type { ItineraryDayGroup, ItineraryItem } from '@/types/itinerary'
import ItineraryCard from '@/components/itinerary/ItineraryCard.vue'

defineProps<{
  groups: ItineraryDayGroup[]
  canEdit: boolean
}>()

const emit = defineEmits<{
  edit: [item: ItineraryItem]
  remove: [item: ItineraryItem]
  addForDay: [dayNumber: number]
}>()
</script>

<template>
  <div class="timeline">
    <section v-for="group in groups" :key="group.dayNumber" class="day-block card">
      <div class="day-head">
        <h2 class="day-title">Day {{ group.dayNumber }}</h2>
        <button
          v-if="canEdit"
          type="button"
          class="add-btn"
          @click="emit('addForDay', group.dayNumber)"
        >
          新增
        </button>
      </div>

      <p v-if="group.items.length === 0" class="empty">這天還沒有行程。</p>

      <div v-else class="day-items">
        <ItineraryCard
          v-for="item in group.items"
          :key="item.id"
          :item="item"
          :can-edit="canEdit"
          @edit="emit('edit', item)"
          @remove="emit('remove', item)"
        />
      </div>
    </section>
  </div>
</template>

<style scoped>
.timeline {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.day-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.25rem;
}

.day-title {
  margin: 0;
  font-size: 1.15rem;
}

.add-btn {
  min-height: 40px;
  padding: 0.35rem 0.85rem;
  border-radius: 8px;
  border: none;
  background: var(--color-primary-soft);
  color: var(--color-primary);
  font-weight: 600;
}

.empty {
  margin: 0.5rem 0 0;
  font-size: 0.9rem;
}

.day-items > * + * {
  border-top: 1px solid var(--color-border);
}
</style>
