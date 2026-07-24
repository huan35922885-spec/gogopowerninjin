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
      <RouterLink class="btn btn-primary create-link" to="/trips/new">建立旅行</RouterLink>
    </div>

    <p v-if="errorMessage" class="message-error" role="alert">{{ errorMessage }}</p>

    <LoadingState v-if="isLoading" />

    <EmptyState
      v-else-if="trips.length === 0"
      title="還沒有旅行"
      description="建立第一趟旅行，開始和朋友一起規劃吧。"
    >
      <RouterLink class="btn btn-primary" to="/trips/new">立即建立</RouterLink>
    </EmptyState>

    <ul v-else class="trip-list">
      <li v-for="trip in trips" :key="trip.id">
        <RouterLink class="trip-card card card-lift" :to="`/trips/${trip.id}`">
          <div
            class="cover"
            :class="{ placeholder: !trip.cover_image_url }"
            :style="
              trip.cover_image_url
                ? { backgroundImage: `url(${trip.cover_image_url})` }
                : undefined
            "
          />
          <div class="trip-body">
            <h2 class="trip-title">{{ trip.title }}</h2>
            <p class="meta">{{ trip.destination || '未設定目的地' }}</p>
            <p class="meta">{{ formatDateRange(trip.start_date, trip.end_date) }}</p>
            <p class="countdown chip chip-green">
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
  text-decoration: none;
  min-height: 44px;
  padding: 0.45rem 0.9rem;
}

.trip-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.trip-card {
  display: block;
  text-decoration: none;
  color: inherit;
  overflow: hidden;
  padding: 0;
  margin-bottom: 0;
}

.trip-card:hover {
  text-decoration: none;
}

.cover {
  height: 9rem;
  background-size: cover;
  background-position: center;
  background-color: var(--color-pink-soft);
}

.cover.placeholder {
  background: linear-gradient(
    135deg,
    var(--color-pink-soft) 0%,
    var(--color-purple-soft) 55%,
    var(--color-green-soft) 100%
  );
}

.trip-body {
  padding: 1rem 1.1rem 1.15rem;
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
  margin: 0.65rem 0 0;
}
</style>
