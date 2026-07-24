<script setup lang="ts">
import { useAuth } from '@/composables/useAuth'

const { isAuthenticated, displayLabel } = useAuth()
</script>

<template>
  <section class="page home">
    <div class="hero">
      <p class="eyebrow">和朋友一起玩</p>
      <h1 class="brand-title">旅遊規劃</h1>
    </div>

    <div v-if="isAuthenticated" class="card welcome-card">
      <p class="hello">嗨，{{ displayLabel }}</p>
      <p class="hint">今天想規劃哪一趟旅行？</p>
      <div class="cta-row">
        <RouterLink class="btn btn-primary btn-block" to="/trips">查看我的旅行</RouterLink>
        <RouterLink class="btn btn-ghost btn-block" to="/trips/new">建立新旅行</RouterLink>
      </div>
    </div>

    <div v-else class="card welcome-card">
      <p class="hello">準備出發了嗎？</p>
      <p class="hint">用 Email 與密碼登入或註冊，立刻開始共同編輯。</p>
      <RouterLink class="btn btn-primary btn-block" to="/login">立即登入</RouterLink>
    </div>
  </section>
</template>

<style scoped>
.hero {
  margin-bottom: 1.5rem;
  padding-top: 0.5rem;
}

.eyebrow {
  margin: 0 0 0.35rem;
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--color-purple);
  letter-spacing: 0.04em;
}

.brand-title {
  margin: 0 0 0.5rem;
  font-size: 2.15rem;
  letter-spacing: -0.03em;
  background: linear-gradient(120deg, var(--color-pink) 10%, var(--color-purple) 90%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.welcome-card {
  margin-bottom: 1.25rem;
}

.hello {
  margin: 0 0 0.25rem;
  font-weight: 800;
  font-size: 1.1rem;
  color: var(--color-text);
}

.hint {
  margin: 0 0 1rem;
}

.cta-row {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}
</style>
