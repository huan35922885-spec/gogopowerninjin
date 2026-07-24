<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTrip } from '@/composables/useTrip'
import { usePermission } from '@/composables/usePermission'
import TripForm from '@/components/trip/TripForm.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import type { TripFormValues } from '@/types/trip'
import { TRIP_ROLE_LABELS } from '@/types/trip'
import { formatDateRange, getCountdownDays } from '@/utils/tripValidation'

const route = useRoute()
const router = useRouter()
const {
  currentTrip,
  members,
  myRole,
  isLoading,
  isSaving,
  errorMessage,
  successMessage,
  fetchTripDetail,
  updateTrip,
  deleteTrip,
  clearMessages,
} = useTrip()

const { canEditTrip, canDeleteTrip } = usePermission(myRole)

const tripId = computed(() => String(route.params.tripId))
const isEditing = ref(false)
const showDeleteConfirm = ref(false)
const localError = ref<string | null>(null)

const countdown = computed(() => {
  if (!currentTrip.value) {
    return null
  }
  return getCountdownDays(currentTrip.value.start_date, currentTrip.value.end_date)
})

watch(
  tripId,
  (id) => {
    void fetchTripDetail(id)
  },
  { immediate: true },
)

async function handleUpdate(values: TripFormValues) {
  if (isSaving.value || !currentTrip.value) {
    return
  }

  clearMessages()
  localError.value = null

  try {
    await updateTrip(currentTrip.value.id, {
      title: values.title,
      destination: values.destination || null,
      description: values.description || null,
      start_date: values.start_date,
      end_date: values.end_date,
      cover_image_url: values.cover_image_url || null,
    })
    isEditing.value = false
  } catch (error) {
    localError.value = error instanceof Error ? error.message : '更新失敗'
  }
}

async function handleDelete() {
  if (!currentTrip.value || isSaving.value) {
    return
  }

  try {
    const id = currentTrip.value.id
    await deleteTrip(id)
    showDeleteConfirm.value = false
    await router.push('/trips')
  } catch {
    showDeleteConfirm.value = false
  }
}
</script>

<template>
  <section class="page">
    <LoadingState v-if="isLoading && !currentTrip" />

    <template v-else-if="currentTrip">
      <div
        v-if="currentTrip.cover_image_url"
        class="hero"
        :style="{ backgroundImage: `url(${currentTrip.cover_image_url})` }"
      />

      <p v-if="localError || errorMessage" class="message-error" role="alert">
        {{ localError || errorMessage }}
      </p>
      <p v-if="successMessage" class="message-success" role="status">{{ successMessage }}</p>

      <template v-if="!isEditing">
        <h1 class="page-title">{{ currentTrip.title }}</h1>
        <p class="page-subtitle">
          {{ currentTrip.destination || '未設定目的地' }}
          ·
          {{ formatDateRange(currentTrip.start_date, currentTrip.end_date) }}
        </p>

        <div class="card">
          <p v-if="countdown" class="countdown chip chip-green">{{ countdown.label }}</p>
          <p v-if="currentTrip.description">{{ currentTrip.description }}</p>
          <p v-else class="muted">尚未填寫旅行介紹。</p>

          <div class="meta-row">
            <span v-if="myRole" class="chip chip-purple">
              {{ TRIP_ROLE_LABELS[myRole] }}
            </span>
          </div>

          <div class="avatars" aria-label="旅行成員">
            <div
              v-for="(member, index) in members"
              :key="member.id"
              class="avatar"
              :class="['tone-' + (index % 3)]"
              :title="member.profile?.display_name || member.user_id"
            >
              <img
                v-if="member.profile?.avatar_url"
                :src="member.profile.avatar_url"
                alt=""
              />
              <span v-else>
                {{ (member.profile?.display_name || '?').slice(0, 1) }}
              </span>
            </div>
          </div>
        </div>

        <div class="card">
          <h2 class="section-title">快速入口</h2>
          <div class="quick-links">
            <RouterLink class="quick pink" :to="`/trips/${tripId}/itinerary`">每日行程</RouterLink>
            <RouterLink class="quick green" :to="`/trips/${tripId}/restaurants`">餐廳候選</RouterLink>
            <RouterLink class="quick purple" :to="`/trips/${tripId}/checklist`">行李清單</RouterLink>
            <RouterLink class="quick soft" :to="`/trips/${tripId}/members`">旅行成員</RouterLink>
          </div>
        </div>

        <div v-if="canEditTrip || canDeleteTrip" class="owner-actions">
          <button
            v-if="canEditTrip"
            type="button"
            class="btn btn-secondary"
            @click="isEditing = true"
          >
            編輯旅行
          </button>
          <button
            v-if="canDeleteTrip"
            type="button"
            class="btn btn-danger"
            @click="showDeleteConfirm = true"
          >
            刪除旅行
          </button>
        </div>
      </template>

      <div v-else class="card">
        <h2 class="section-title">編輯旅行</h2>
        <TripForm
          mode="edit"
          :initial-trip="currentTrip"
          :submitting="isSaving"
          @submit="handleUpdate"
          @cancel="isEditing = false"
        />
      </div>
    </template>

    <p v-else class="message-error">找不到旅行資料。</p>

    <ConfirmDialog
      :open="showDeleteConfirm"
      title="刪除旅行？"
      message="刪除後，行程、餐廳、行李清單與成員資料都會一併移除，且無法復原。"
      confirm-label="確認刪除"
      danger
      :loading="isSaving"
      @cancel="showDeleteConfirm = false"
      @confirm="handleDelete"
    />
  </section>
</template>

<style scoped>
.hero {
  height: 10rem;
  margin: -1rem -1rem 1rem;
  background-size: cover;
  background-position: center;
  background-color: var(--color-pink-soft);
  border-radius: 0 0 var(--radius) var(--radius);
}

.countdown {
  margin: 0 0 0.75rem;
}

.muted {
  color: var(--color-text-muted);
}

.meta-row {
  margin-top: 0.75rem;
}

.avatars {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-top: 0.75rem;
}

.avatar {
  width: 2.35rem;
  height: 2.35rem;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  overflow: hidden;
  border: 2px solid #fff;
  box-shadow: var(--shadow);
}

.avatar.tone-0 {
  background: var(--color-pink-soft);
  color: var(--color-pink-deep);
}

.avatar.tone-1 {
  background: var(--color-green-soft);
  color: var(--color-green-deep);
}

.avatar.tone-2 {
  background: var(--color-purple-soft);
  color: var(--color-purple-deep);
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.section-title {
  font-size: 1.05rem;
  margin-bottom: 0.75rem;
}

.quick-links {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.quick {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 52px;
  padding: 0.75rem;
  border-radius: var(--radius-sm);
  font-weight: 800;
  text-decoration: none;
}

.quick:hover {
  text-decoration: none;
  filter: brightness(0.98);
}

.quick.pink {
  background: var(--color-pink-soft);
  color: var(--color-pink-deep);
}

.quick.green {
  background: var(--color-green-soft);
  color: var(--color-green-deep);
}

.quick.purple {
  background: var(--color-purple-soft);
  color: var(--color-purple-deep);
}

.quick.soft {
  background: #fff;
  border: 1.5px solid var(--color-border);
  color: var(--color-text);
}

.owner-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 0.5rem;
}
</style>
