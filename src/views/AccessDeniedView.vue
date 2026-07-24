<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()
const tripId = typeof route.query.tripId === 'string' ? route.query.tripId : null
</script>

<template>
  <section class="page">
    <h1 class="page-title">無法存取</h1>
    <p class="page-subtitle">
      你沒有權限查看此旅行，或這趟旅行不存在。
    </p>
    <div class="card">
      <p v-if="tripId">旅行 ID：{{ tripId }}</p>
      <p>請向旅行的 owner 確認是否已將你加入成員。</p>
      <div class="actions">
        <RouterLink class="btn btn-primary" to="/trips">回到旅行列表</RouterLink>
        <RouterLink class="btn btn-ghost" to="/">回首頁</RouterLink>
      </div>
    </div>
  </section>
</template>

<style scoped>
.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-top: 0.5rem;
}
</style>
