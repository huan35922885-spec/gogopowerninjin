<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

const router = useRouter()
const route = useRoute()
const { user, profile, displayLabel, isAuthenticated, isLoading, signOut } = useAuth()

const menuOpen = ref(false)

function closeMenu() {
  menuOpen.value = false
}

function toggleMenu() {
  menuOpen.value = !menuOpen.value
}

async function handleSignOut() {
  closeMenu()
  try {
    await signOut()
    await router.push({ name: 'home' })
  } catch {
    // 錯誤訊息由 store 保存；版面仍維持可用
  }
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    closeMenu()
  }
}

watch(
  () => route.fullPath,
  () => {
    closeMenu()
  },
)

watch(menuOpen, (open) => {
  document.body.style.overflow = open ? 'hidden' : ''
})

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = ''
})
</script>

<template>
  <div class="app-shell">
    <header class="app-header">
      <RouterLink to="/" class="brand" @click="closeMenu">旅遊規劃</RouterLink>

      <!-- 桌面導覽 -->
      <nav class="nav-desktop" aria-label="主要導覽">
        <RouterLink
          to="/"
          class="nav-link"
          active-class=""
          exact-active-class="router-link-active"
        >
          首頁
        </RouterLink>
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

      <!-- 手機：漢堡 -->
      <button
        class="menu-toggle"
        type="button"
        :aria-expanded="menuOpen"
        aria-controls="mobile-menu"
        :aria-label="menuOpen ? '關閉選單' : '開啟選單'"
        @click="toggleMenu"
      >
        <span class="menu-toggle-bars" :class="{ open: menuOpen }" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
      </button>
    </header>

    <div
      class="menu-backdrop"
      :class="{ open: menuOpen }"
      aria-hidden="true"
      @click="closeMenu"
    />

    <nav
      id="mobile-menu"
      class="nav-mobile"
      :class="{ open: menuOpen }"
      aria-label="手機導覽"
      :aria-hidden="!menuOpen"
    >
      <template v-if="isAuthenticated">
        <RouterLink to="/profile" class="mobile-profile" @click="closeMenu">
          <span class="nav-avatar lg">
            <img v-if="profile?.avatar_url" :src="profile.avatar_url" alt="" />
            <span v-else>{{ displayLabel.slice(0, 1) }}</span>
          </span>
          <span class="mobile-profile-text">
            <span class="mobile-profile-name">{{ displayLabel }}</span>
            <span class="mobile-profile-email">{{ user?.email }}</span>
          </span>
        </RouterLink>
        <div class="mobile-divider" />
      </template>

      <RouterLink
        to="/"
        class="mobile-link"
        active-class=""
        exact-active-class="router-link-active"
        @click="closeMenu"
      >
        首頁
      </RouterLink>
      <RouterLink to="/trips" class="mobile-link" @click="closeMenu">旅行</RouterLink>
      <RouterLink
        v-if="isAuthenticated"
        to="/profile"
        class="mobile-link"
        @click="closeMenu"
      >
        個人資料
      </RouterLink>
      <RouterLink
        v-else
        to="/login"
        class="mobile-link mobile-link-cta"
        @click="closeMenu"
      >
        登入
      </RouterLink>

      <button
        v-if="isAuthenticated"
        class="btn btn-secondary btn-block mobile-sign-out"
        type="button"
        :disabled="isLoading"
        @click="handleSignOut"
      >
        登出
      </button>
    </nav>

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
  z-index: 40;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  height: var(--header-height);
  padding: 0 1rem;
  background: rgba(255, 255, 255, 0.92);
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
  flex-shrink: 0;
}

.brand:hover {
  text-decoration: none;
  opacity: 0.9;
}

/* —— Desktop nav（預設隱藏，寬螢幕顯示） —— */
.nav-desktop {
  display: none;
  align-items: center;
  gap: 0.35rem;
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

.nav-avatar.lg {
  width: 2.75rem;
  height: 2.75rem;
  font-size: 1.1rem;
}

.nav-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.nav-name {
  max-width: 7rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sign-out {
  min-height: 40px;
  padding: 0.35rem 0.75rem;
  font-size: 0.85rem;
}

/* —— Hamburger —— */
.menu-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.75rem;
  height: 2.75rem;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-purple-deep);
  padding: 0;
  flex-shrink: 0;
}

.menu-toggle:hover {
  background: var(--color-purple-soft);
}

.menu-toggle-bars {
  position: relative;
  width: 1.25rem;
  height: 0.9rem;
  display: block;
}

.menu-toggle-bars span {
  position: absolute;
  left: 0;
  width: 100%;
  height: 2px;
  border-radius: 2px;
  background: currentColor;
  transition: transform 0.2s ease, opacity 0.2s ease, top 0.2s ease;
}

.menu-toggle-bars span:nth-child(1) {
  top: 0;
}

.menu-toggle-bars span:nth-child(2) {
  top: 50%;
  margin-top: -1px;
}

.menu-toggle-bars span:nth-child(3) {
  bottom: 0;
}

.menu-toggle-bars.open span:nth-child(1) {
  top: 50%;
  margin-top: -1px;
  transform: rotate(45deg);
}

.menu-toggle-bars.open span:nth-child(2) {
  opacity: 0;
}

.menu-toggle-bars.open span:nth-child(3) {
  bottom: auto;
  top: 50%;
  margin-top: -1px;
  transform: rotate(-45deg);
}

/* —— Mobile drawer —— */
.menu-backdrop {
  position: fixed;
  inset: 0;
  z-index: 30;
  background: rgba(42, 36, 48, 0.35);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s ease;
}

.menu-backdrop.open {
  opacity: 1;
  pointer-events: auto;
}

.nav-mobile {
  position: fixed;
  top: var(--header-height);
  right: 0;
  z-index: 35;
  width: min(18.5rem, 86vw);
  height: calc(100vh - var(--header-height));
  height: calc(100dvh - var(--header-height));
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  background: #fff;
  border-left: 1px solid var(--color-border);
  box-shadow: -8px 0 24px rgba(42, 36, 48, 0.08);
  transform: translateX(105%);
  transition: transform 0.22s ease;
  overflow-y: auto;
}

.nav-mobile.open {
  transform: translateX(0);
}

.mobile-profile {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.65rem;
  border-radius: var(--radius);
  text-decoration: none;
  color: var(--color-text);
  background: linear-gradient(135deg, var(--color-pink-soft), var(--color-purple-soft));
}

.mobile-profile:hover {
  text-decoration: none;
}

.mobile-profile-text {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
}

.mobile-profile-name {
  font-weight: 800;
  font-size: 1rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mobile-profile-email {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mobile-divider {
  height: 1px;
  background: var(--color-border);
  margin: 0.35rem 0 0.5rem;
}

.mobile-link {
  display: flex;
  align-items: center;
  min-height: 48px;
  padding: 0.65rem 0.85rem;
  border-radius: var(--radius-sm);
  color: var(--color-text);
  font-weight: 700;
  text-decoration: none;
}

.mobile-link:hover {
  text-decoration: none;
  background: var(--color-purple-soft);
  color: var(--color-purple-deep);
}

.mobile-link.router-link-active {
  background: var(--color-purple-soft);
  color: var(--color-purple-deep);
}

.mobile-link-cta {
  background: var(--color-pink-soft);
  color: var(--color-pink-deep);
  justify-content: center;
}

.mobile-sign-out {
  margin-top: auto;
}

.app-main {
  flex: 1;
  min-width: 0;
}

@media (min-width: 768px) {
  .menu-toggle,
  .menu-backdrop,
  .nav-mobile {
    display: none;
  }

  .nav-desktop {
    display: flex;
  }
}

@media (prefers-reduced-motion: reduce) {
  .menu-toggle-bars span,
  .menu-backdrop,
  .nav-mobile {
    transition: none;
  }
}
</style>
