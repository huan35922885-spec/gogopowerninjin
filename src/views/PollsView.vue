<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useTrip } from '@/composables/useTrip'
import { usePermission } from '@/composables/usePermission'
import { usePolls } from '@/composables/usePolls'
import * as restaurantService from '@/services/restaurantService'
import * as itineraryService from '@/services/itineraryService'
import PollForm from '@/components/poll/PollForm.vue'
import PollCard from '@/components/poll/PollCard.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import type { Poll, PollFormValues } from '@/types/poll'

const route = useRoute()
const tripId = computed(() => String(route.params.tripId))

const {
  currentTrip,
  myRole,
  isLoading: isTripLoading,
  fetchTripDetail,
} = useTrip()

const { canEditContent, canView } = usePermission(myRole)

const {
  polls,
  isLoading,
  isSaving,
  errorMessage,
  successMessage,
  clearMessages,
  fetchPolls,
  createPoll,
  castVote,
  closePoll,
  deletePoll,
} = usePolls(tripId)

const showForm = ref(false)
const pendingDelete = ref<Poll | null>(null)
const localError = ref<string | null>(null)

const restaurantChoices = ref<{ id: string; name: string }[]>([])
const itineraryChoices = ref<{ id: string; title: string; day_number: number }[]>([])

const openPolls = computed(() => polls.value.filter((p) => p.status === 'open'))
const closedPolls = computed(() => polls.value.filter((p) => p.status === 'closed'))

watch(
  tripId,
  async (id) => {
    if (!currentTrip.value || currentTrip.value.id !== id) {
      await fetchTripDetail(id)
    }
    await Promise.all([fetchPolls(), loadChoiceSources()])
  },
  { immediate: true },
)

async function loadChoiceSources() {
  try {
    const [restaurants, items] = await Promise.all([
      restaurantService.listRestaurants(tripId.value),
      itineraryService.listItineraryItems(tripId.value),
    ])
    restaurantChoices.value = restaurants.map((r) => ({ id: r.id, name: r.name }))
    itineraryChoices.value = items.map((item) => ({
      id: item.id,
      title: item.title,
      day_number: item.day_number,
    }))
  } catch {
    restaurantChoices.value = []
    itineraryChoices.value = []
  }
}

function openCreate() {
  if (!canEditContent.value) {
    return
  }
  clearMessages()
  localError.value = null
  showForm.value = true
}

function closeForm() {
  showForm.value = false
}

async function handleSubmit(values: PollFormValues) {
  if (isSaving.value) {
    return
  }

  localError.value = null
  try {
    await createPoll(values, restaurantChoices.value, itineraryChoices.value)
    closeForm()
  } catch (error) {
    localError.value = error instanceof Error ? error.message : '建立失敗'
  }
}

async function handleVote(poll: Poll, optionId: string) {
  if (isSaving.value) {
    return
  }
  localError.value = null
  try {
    await castVote(poll.id, optionId)
  } catch (error) {
    localError.value = error instanceof Error ? error.message : '投票失敗'
  }
}

async function handleClose(poll: Poll) {
  if (isSaving.value) {
    return
  }
  try {
    await closePoll(poll.id)
  } catch (error) {
    localError.value = error instanceof Error ? error.message : '結束失敗'
  }
}

async function confirmDelete() {
  if (!pendingDelete.value || isSaving.value) {
    return
  }

  try {
    await deletePoll(pendingDelete.value.id)
  } finally {
    pendingDelete.value = null
  }
}
</script>

<template>
  <section class="page">
    <div class="page-head">
      <div>
        <h1 class="page-title">投票</h1>
        <p class="page-subtitle">
          餐廳、行程或時間都能投。2 選 1、3 選 1 都可以。
          <span v-if="!canEditContent">（唯讀成員可投票）</span>
        </p>
      </div>
      <button
        v-if="canEditContent && !showForm"
        type="button"
        class="btn btn-primary"
        @click="openCreate"
      >
        發起投票
      </button>
    </div>

    <p v-if="localError || errorMessage" class="message-error" role="alert">
      {{ localError || errorMessage }}
    </p>
    <p v-if="successMessage" class="message-success" role="status">
      {{ successMessage }}
    </p>

    <LoadingState v-if="isTripLoading || isLoading" label="載入投票中…" />

    <PollForm
      v-else-if="showForm"
      :restaurants="restaurantChoices"
      :itinerary-items="itineraryChoices"
      :submitting="isSaving"
      @submit="handleSubmit"
      @cancel="closeForm"
    />

    <template v-else>
      <EmptyState
        v-if="polls.length === 0"
        title="還沒有投票"
        description="發起一個投票，讓大家一起決定餐廳、行程或集合時間。"
      >
        <button
          v-if="canEditContent"
          type="button"
          class="btn btn-primary"
          @click="openCreate"
        >
          發起第一個投票
        </button>
      </EmptyState>

      <template v-else>
        <div v-if="openPolls.length" class="poll-section">
          <h2 class="section-label">進行中</h2>
          <PollCard
            v-for="poll in openPolls"
            :key="poll.id"
            :poll="poll"
            :can-manage="canEditContent"
            :can-vote="canView"
            :submitting="isSaving"
            @vote="(optionId) => handleVote(poll, optionId)"
            @close="handleClose(poll)"
            @remove="pendingDelete = poll"
          />
        </div>

        <div v-if="closedPolls.length" class="poll-section">
          <h2 class="section-label">已結束</h2>
          <PollCard
            v-for="poll in closedPolls"
            :key="poll.id"
            :poll="poll"
            :can-manage="canEditContent"
            :can-vote="false"
            :submitting="isSaving"
            @remove="pendingDelete = poll"
          />
        </div>
      </template>
    </template>

    <ConfirmDialog
      :open="pendingDelete != null"
      title="刪除投票？"
      :message="pendingDelete ? `確定刪除「${pendingDelete.title}」？票數也會一併清除。` : ''"
      confirm-label="刪除"
      danger
      :loading="isSaving"
      @confirm="confirmDelete"
      @cancel="pendingDelete = null"
    />
  </section>
</template>

<style scoped>
.page-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.25rem;
  flex-wrap: wrap;
}

.page-head .page-subtitle {
  margin-bottom: 0;
}

.page-head .btn {
  flex-shrink: 0;
  min-height: 44px;
}

@media (max-width: 479px) {
  .page-head .btn {
    width: 100%;
  }
}

.poll-section {
  margin-bottom: 1.25rem;
}

.section-label {
  margin: 0 0 0.65rem;
  font-size: 0.95rem;
  color: var(--color-purple-deep);
}
</style>
