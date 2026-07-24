<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

const router = useRouter()
const { user, isAuthenticated, isLoading, signOut } = useAuth()

async function handleSignOut() {
  try {
    await signOut()
    await router.push({ name: 'home' })
  } catch {
    // 錯誤訊息由 store 保存；版面仍維持可用
  }
}
</script>

<template>
  <div class="app-shell">
    <header class="app-header">
      <RouterLink to="/" class="brand">旅遊規劃</RouterLink>
      <nav class="nav" aria-label="主要導覽">
        <RouterLink to="/">首頁</RouterLink>
        <RouterLink to="/trips">旅行</RouterLink>
        <template v-if="isAuthenticated">
          <span class="user-email" :title="user?.email ?? ''">
            {{ user?.email }}
          </span>
          <button
            class="sign-out"
            type="button"
            :disabled="isLoading"
            @click="handleSignOut"
          >
            登出
          </button>
        </template>
        <RouterLink v-else to="/login">登入</RouterLink>
      </nav>
    </header>
    <main class="app-main">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  height: var(--header-height);
  padding: 0 1rem;
  background: rgba(255, 255, 255, 0.92);
  border-bottom: 1px solid var(--color-border);
  backdrop-filter: blur(8px);
}

.brand {
  font-weight: 700;
  font-size: 1.1rem;
  color: var(--color-text);
  text-decoration: none;
}

.brand:hover {
  text-decoration: none;
  color: var(--color-primary);
}

.nav {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.nav a {
  color: var(--color-text-muted);
  text-decoration: none;
  font-size: 0.95rem;
  padding: 0.4rem 0.5rem;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
}

.nav a.router-link-active {
  color: var(--color-primary);
  font-weight: 600;
}

.user-email {
  max-width: 9rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.sign-out {
  min-height: 44px;
  padding: 0.4rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: #fff;
  color: var(--color-text);
  font: inherit;
  font-size: 0.9rem;
}

.sign-out:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.app-main {
  flex: 1;
}
</style>
