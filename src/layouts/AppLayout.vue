<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

const router = useRouter()
const { user, profile, displayLabel, isAuthenticated, isLoading, signOut } = useAuth()

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
        <RouterLink to="/" class="nav-link">首頁</RouterLink>
        <RouterLink to="/trips" class="nav-link">旅行</RouterLink>
        <template v-if="isAuthenticated">
          <RouterLink to="/profile" class="profile-link" :title="user?.email ?? ''">
            <span class="nav-avatar">
              <img v-if="profile?.avatar_url" :src="profile.avatar_url" alt="" />
              <span v-else>{{ displayLabel.slice(0, 1) }}</span>
            </span>
            <span class="nav-name">{{ displayLabel }}</span>
          </RouterLink>
          <button
            class="btn btn-secondary sign-out"
            type="button"
            :disabled="isLoading"
            @click="handleSignOut"
          >
            登出
          </button>
        </template>
        <RouterLink v-else to="/login" class="nav-link nav-cta">登入</RouterLink>
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
  background: rgba(255, 255, 255, 0.88);
  border-bottom: 1px solid var(--color-pink-soft);
  backdrop-filter: blur(12px);
}

.brand {
  font-weight: 800;
  font-size: 1.15rem;
  text-decoration: none;
  background: linear-gradient(120deg, var(--color-pink) 0%, var(--color-purple) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.brand:hover {
  text-decoration: none;
  opacity: 0.9;
}

.nav {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.nav-link {
  color: var(--color-text-muted);
  text-decoration: none;
  font-size: 0.92rem;
  font-weight: 600;
  padding: 0.4rem 0.7rem;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  border-radius: var(--radius-pill);
}

.nav-link:hover {
  text-decoration: none;
  color: var(--color-purple);
  background: var(--color-purple-soft);
}

.nav-link.router-link-active {
  color: var(--color-purple-deep);
  background: var(--color-purple-soft);
  font-weight: 800;
}

.nav-cta {
  background: var(--color-pink-soft);
  color: var(--color-pink-deep);
}

.nav-cta:hover {
  background: var(--color-pink-soft);
  color: var(--color-pink-deep);
}

.profile-link {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  min-height: 44px;
  padding: 0.25rem 0.55rem 0.25rem 0.25rem;
  border-radius: var(--radius-pill);
  text-decoration: none;
  color: var(--color-text);
  font-weight: 700;
  font-size: 0.85rem;
}

.profile-link:hover,
.profile-link.router-link-active {
  text-decoration: none;
  background: var(--color-pink-soft);
  color: var(--color-pink-deep);
}

.nav-avatar {
  width: 1.85rem;
  height: 1.85rem;
  border-radius: 50%;
  overflow: hidden;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--color-purple-soft);
  color: var(--color-purple-deep);
  font-size: 0.8rem;
  font-weight: 800;
  flex-shrink: 0;
}

.nav-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.nav-name {
  max-width: 6.5rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sign-out {
  min-height: 40px;
  padding: 0.35rem 0.75rem;
  font-size: 0.85rem;
}

.app-main {
  flex: 1;
}
</style>
