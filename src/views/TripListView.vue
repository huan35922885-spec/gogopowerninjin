<script setup lang="ts">
import { onMounted } from 'vue'
import { useTrip } from '@/composables/useTrip'
import LoadingState from '@/components/common/LoadingState.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { formatDateRange, getCountdownDays } from '@/utils/tripValidation'

const { trips, isLoading, errorMessage, fetchTrips } = useTrip()

onMounted(() => {
  void fetchTrips()
})
</script>

<template>
  <section class="page">
    <div class="page-head">
      <div>
        <h1 class="page-title">我的旅行</h1>
        <p class="page-subtitle">查看並管理你參與的旅行。</p>
      </div>
      <RouterLink class="create-link" to="/trips/new">建立旅行</RouterLink>
    </div>

    <p v-if="errorMessage" class="message-error" role="alert">{{ errorMessage }}</p>

    <LoadingState v-if="isLoading" />

    <EmptyState
      v-else-if="trips.length === 0"
      title="還沒有旅行"
      description="建立第一趟旅行，開始和朋友一起規劃吧。"
    >
      <RouterLink to="/trips/new">立即建立</RouterLink>
    </EmptyState>

    <ul v-else class="trip-list">
      <li v-for="trip in trips" :key="trip.id">
        <RouterLink class="trip-card card" :to="`/trips/${trip.id}`">
          <div
            v-if="trip.cover_image_url"
            class="cover"
            :style="{ backgroundImage: `url(${trip.cover_image_url})` }"
          />
          <div class="trip-body">
            <h2 class="trip-title">{{ trip.title }}</h2>
            <p class="meta">{{ trip.destination || '未設定目的地' }}</p>
            <p class="meta">{{ formatDateRange(trip.start_date, trip.end_date) }}</p>
            <p class="countdown">
              {{ getCountdownDays(trip.start_date, trip.end_date).label }}
            </p>
          </div>
        </RouterLink>
      </li>
    </ul>
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

.create-link {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  padding: 0.5rem 0.9rem;
  border-radius: 10px;
  background: var(--color-primary);
  color: #fff;
  font-weight: 600;
  text-decoration: none;
}

.message-error {
  color: var(--color-danger);
}

.trip-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.trip-card {
  display: block;
  text-decoration: none;
  color: inherit;
  overflow: hidden;
  padding: 0;
}

.trip-card:hover {
  text-decoration: none;
}

.cover {
  height: 8rem;
  background-size: cover;
  background-position: center;
  background-color: var(--color-primary-soft);
}

.trip-body {
  padding: 1rem;
}

.trip-title {
  font-size: 1.15rem;
  margin-bottom: 0.35rem;
}

.meta {
  margin: 0 0 0.25rem;
  font-size: 0.9rem;
}

.countdown {
  margin: 0.5rem 0 0;
  color: var(--color-primary);
  font-weight: 600;
  font-size: 0.9rem;
}
</style>
