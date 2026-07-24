<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useTrip } from '@/composables/useTrip'
import { usePermission } from '@/composables/usePermission'
import { useItinerary } from '@/composables/useItinerary'
import DayTimeline from '@/components/itinerary/DayTimeline.vue'
import ItineraryForm from '@/components/itinerary/ItineraryForm.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import type { ItineraryFormValues, ItineraryItem } from '@/types/itinerary'

const route = useRoute()
const tripId = computed(() => String(route.params.tripId))

const {
  currentTrip,
  myRole,
  isLoading: isTripLoading,
  fetchTripDetail,
} = useTrip()

const { canEditContent } = usePermission(myRole)

const tripDates = computed(() =>
  currentTrip.value
    ? {
        start_date: currentTrip.value.start_date,
        end_date: currentTrip.value.end_date,
      }
    : null,
)

const {
  dayGroups,
  tripDayCount,
  isLoading,
  isSaving,
  errorMessage,
  successMessage,
  clearMessages,
  fetchItems,
  createItem,
  updateItem,
  deleteItem,
} = useItinerary(tripId, tripDates)

const showForm = ref(false)
const formMode = ref<'create' | 'edit'>('create')
const editingItem = ref<ItineraryItem | null>(null)
const defaultDayNumber = ref(1)
const pendingDelete = ref<ItineraryItem | null>(null)
const localError = ref<string | null>(null)

watch(
  tripId,
  async (id) => {
    if (!currentTrip.value || currentTrip.value.id !== id) {
      await fetchTripDetail(id)
    }
    await fetchItems()
  },
  { immediate: true },
)

function openCreate(dayNumber: number) {
  if (!canEditContent.value) {
    return
  }
  clearMessages()
  localError.value = null
  formMode.value = 'create'
  editingItem.value = null
  defaultDayNumber.value = dayNumber
  showForm.value = true
}

function openEdit(item: ItineraryItem) {
  if (!canEditContent.value) {
    return
  }
  clearMessages()
  localError.value = null
  formMode.value = 'edit'
  editingItem.value = item
  defaultDayNumber.value = item.day_number
  showForm.value = true
}

function closeForm() {
  showForm.value = false
  editingItem.value = null
}

async function handleSubmit(values: ItineraryFormValues) {
  if (isSaving.value) {
    return
  }

  localError.value = null
  try {
    if (formMode.value === 'create') {
      await createItem(values)
    } else if (editingItem.value) {
      await updateItem(editingItem.value.id, values)
    }
    closeForm()
  } catch (error) {
    localError.value = error instanceof Error ? error.message : '儲存失敗'
  }
}

async function confirmDelete() {
  if (!pendingDelete.value || isSaving.value) {
    return
  }

  try {
    await deleteItem(pendingDelete.value.id)
  } finally {
    pendingDelete.value = null
  }
}
</script>

<template>
  <section class="page">
    <div class="page-head">
      <div>
        <h1 class="page-title">每日行程</h1>
        <p class="page-subtitle">
          依 Day 分組，並依開始時間與排序顯示。
          <span v-if="!canEditContent">（唯讀）</span>
        </p>
      </div>
      <button
        v-if="canEditContent"
        type="button"
        class="create-btn"
        @click="openCreate(1)"
      >
        新增行程
      </button>
    </div>

    <p v-if="localError || errorMessage" class="message-error" role="alert">
      {{ localError || errorMessage }}
    </p>
    <p v-if="successMessage" class="message-success" role="status">{{ successMessage }}</p>

    <LoadingState v-if="(isLoading || isTripLoading) && dayGroups.length === 0" />

    <div v-if="showForm" class="card form-card">
      <h2 class="form-title">
        {{ formMode === 'create' ? '新增行程' : '編輯行程' }}
      </h2>
      <ItineraryForm
        :mode="formMode"
        :initial-item="editingItem"
        :default-day-number="defaultDayNumber"
        :max-day-number="tripDayCount"
        :submitting="isSaving"
        @submit="handleSubmit"
        @cancel="closeForm"
      />
    </div>

    <DayTimeline
      v-else
      :groups="dayGroups"
      :can-edit="canEditContent"
      @edit="openEdit"
      @remove="pendingDelete = $event"
      @add-for-day="openCreate"
    />

    <ConfirmDialog
      :open="pendingDelete != null"
      title="刪除行程？"
      :message="pendingDelete ? `確定要刪除「${pendingDelete.title}」嗎？` : ''"
      confirm-label="確認刪除"
      danger
      :loading="isSaving"
      @cancel="pendingDelete = null"
      @confirm="confirmDelete"
    />
  </section>
</template>

<style scoped>
.page-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.5rem;
}

.create-btn {
  flex-shrink: 0;
  min-height: 44px;
  padding: 0.5rem 0.9rem;
  border: none;
  border-radius: 10px;
  background: var(--color-primary);
  color: #fff;
  font-weight: 600;
}

.form-title {
  font-size: 1.05rem;
  margin-bottom: 0.75rem;
}

.form-card {
  margin-bottom: 1rem;
}

.message-error {
  color: var(--color-danger);
}

.message-success {
  color: var(--color-primary);
}
</style>
