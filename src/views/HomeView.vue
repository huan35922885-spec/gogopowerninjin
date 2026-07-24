<script setup lang="ts">
import { useAuth } from '@/composables/useAuth'

const { isAuthenticated, user } = useAuth()
</script>

<template>
  <section class="page">
    <h1 class="page-title">一起規劃旅行</h1>
    <p class="page-subtitle">
      和朋友共同編輯行程、餐廳候選與行李清單。
    </p>

    <div v-if="isAuthenticated" class="card">
      <p>已登入：{{ user?.email }}</p>
      <ul class="links">
        <li><RouterLink to="/trips">查看旅行列表</RouterLink></li>
        <li><RouterLink to="/trips/new">建立新旅行</RouterLink></li>
      </ul>
    </div>

    <div v-else class="card">
      <p>登入後即可建立與編輯旅行。</p>
      <ul class="links">
        <li><RouterLink to="/login">使用 Magic Link 登入</RouterLink></li>
      </ul>
    </div>
  </section>
</template>

<style scoped>
.links {
  margin: 0;
  padding-left: 1.25rem;
  line-height: 2;
}
</style>
