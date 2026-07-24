<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useTrip } from '@/composables/useTrip'
import { usePermission } from '@/composables/usePermission'
import { useRestaurants } from '@/composables/useRestaurants'
import RestaurantCard from '@/components/restaurant/RestaurantCard.vue'
import RestaurantForm from '@/components/restaurant/RestaurantForm.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import type { Restaurant, RestaurantFormValues, RestaurantStatus } from '@/types/restaurant'
import { RESTAURANT_STATUS_LABELS } from '@/types/restaurant'

const route = useRoute()
const tripId = computed(() => String(route.params.tripId))

const {
  currentTrip,
  myRole,
  isLoading: isTripLoading,
  fetchTripDetail,
} = useTrip()

const { canEditContent } = usePermission(myRole)

const {
  restaurants,
  isLoading,
  isSaving,
  errorMessage,
  successMessage,
  clearMessages,
  fetchRestaurants,
  createRestaurant,
  updateRestaurant,
  deleteRestaurant,
} = useRestaurants(tripId)

const statusFilter = ref<'all' | RestaurantStatus>('all')
const showForm = ref(false)
const formMode = ref<'create' | 'edit'>('create')
const editingRestaurant = ref<Restaurant | null>(null)
const pendingDelete = ref<Restaurant | null>(null)
const localError = ref<string | null>(null)

const filteredRestaurants = computed(() => {
  if (statusFilter.value === 'all') {
    return restaurants.value
  }
  return restaurants.value.filter((item) => item.status === statusFilter.value)
})

watch(
  tripId,
  async (id) => {
    if (!currentTrip.value || currentTrip.value.id !== id) {
      await fetchTripDetail(id)
    }
    await fetchRestaurants()
  },
  { immediate: true },
)

function openCreate() {
  if (!canEditContent.value) {
    return
  }
  clearMessages()
  localError.value = null
  formMode.value = 'create'
  editingRestaurant.value = null
  showForm.value = true
}

function openEdit(restaurant: Restaurant) {
  if (!canEditContent.value) {
    return
  }
  clearMessages()
  localError.value = null
  formMode.value = 'edit'
  editingRestaurant.value = restaurant
  showForm.value = true
}

function closeForm() {
  showForm.value = false
  editingRestaurant.value = null
}

async function handleSubmit(values: RestaurantFormValues) {
  if (isSaving.value) {
    return
  }

  localError.value = null
  try {
    if (formMode.value === 'create') {
      await createRestaurant(values)
    } else if (editingRestaurant.value) {
      await updateRestaurant(editingRestaurant.value.id, values)
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
    await deleteRestaurant(pendingDelete.value.id)
  } finally {
    pendingDelete.value = null
  }
}
</script>

<template>
  <section class="page">
    <div class="page-head">
      <div>
        <h1 class="page-title">餐廳候選</h1>
        <p class="page-subtitle">
          管理候選、已選擇與不採用的餐廳。
          <span v-if="!canEditContent">（唯讀）</span>
        </p>
      </div>
      <button
        v-if="canEditContent"
        type="button"
        class="create-btn"
        @click="openCreate"
      >
        新增餐廳
      </button>
    </div>

    <p v-if="localError || errorMessage" class="message-error" role="alert">
      {{ localError || errorMessage }}
    </p>
    <p v-if="successMessage" class="message-success" role="status">{{ successMessage }}</p>

    <div v-if="!showForm" class="filters" role="group" aria-label="狀態篩選">
      <button
        type="button"
        class="filter-btn"
        :class="{ active: statusFilter === 'all' }"
        @click="statusFilter = 'all'"
      >
        全部
      </button>
      <button
        v-for="(label, status) in RESTAURANT_STATUS_LABELS"
        :key="status"
        type="button"
        class="filter-btn"
        :class="{ active: statusFilter === status }"
        @click="statusFilter = status"
      >
        {{ label }}
      </button>
    </div>

    <LoadingState v-if="(isLoading || isTripLoading) && restaurants.length === 0" />

    <div v-if="showForm" class="card form-card">
      <h2 class="form-title">
        {{ formMode === 'create' ? '新增餐廳' : '編輯餐廳' }}
      </h2>
      <RestaurantForm
        :mode="formMode"
        :initial-restaurant="editingRestaurant"
        :submitting="isSaving"
        @submit="handleSubmit"
        @cancel="closeForm"
      />
    </div>

    <template v-else>
      <EmptyState
        v-if="!isLoading && filteredRestaurants.length === 0"
        title="目前沒有餐廳"
        description="新增幾家候選餐廳，方便大家一起決定吃哪裡。"
      >
        <button
          v-if="canEditContent"
          type="button"
          class="create-btn"
          @click="openCreate"
        >
          新增餐廳
        </button>
      </EmptyState>

      <div v-else class="list">
        <RestaurantCard
          v-for="restaurant in filteredRestaurants"
          :key="restaurant.id"
          :restaurant="restaurant"
          :can-edit="canEditContent"
          @edit="openEdit(restaurant)"
          @remove="pendingDelete = restaurant"
        />
      </div>
    </template>

    <ConfirmDialog
      :open="pendingDelete != null"
      title="刪除餐廳？"
      :message="pendingDelete ? `確定要刪除「${pendingDelete.name}」嗎？` : ''"
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
  flex-wrap: wrap;
}

.create-btn {
  flex-shrink: 0;
  min-height: 44px;
  padding: 0.5rem 0.9rem;
  border: none;
  border-radius: var(--radius-sm);
  background: linear-gradient(135deg, var(--color-pink) 0%, #f078a4 100%);
  color: #fff;
  font-weight: 800;
}

@media (max-width: 479px) {
  .create-btn {
    width: 100%;
  }
}

.filters {
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
  margin-bottom: 0.85rem;
}

.filter-btn {
  min-height: 40px;
  padding: 0.35rem 0.75rem;
  border-radius: var(--radius-pill);
  border: 1.5px solid var(--color-border);
  background: #fff;
  color: var(--color-text-muted);
  font-size: 0.85rem;
  font-weight: 700;
}

.filter-btn.active {
  background: var(--color-purple-soft);
  border-color: transparent;
  color: var(--color-purple-deep);
}

.list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.form-title {
  font-size: 1.05rem;
  margin-bottom: 0.75rem;
}

.form-card {
  margin-bottom: 1rem;
  border-top: 3px solid var(--color-green);
}
</style>
