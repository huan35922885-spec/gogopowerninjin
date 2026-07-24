<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

type AuthMode = 'login' | 'register'

const route = useRoute()
const router = useRouter()
const {
  isAuthenticated,
  isLoading,
  errorMessage,
  successMessage,
  signIn,
  signUp,
  clearMessages,
} = useAuth()

const mode = ref<AuthMode>('login')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const localError = ref<string | null>(null)

function validateForm(): string | null {
  const trimmedEmail = email.value.trim()
  if (!trimmedEmail) {
    return '請輸入 Email'
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    return 'Email 格式不正確'
  }
  if (!password.value) {
    return '請輸入密碼'
  }
  if (password.value.length < 6) {
    return '密碼至少需要 6 個字元'
  }
  if (mode.value === 'register' && password.value !== confirmPassword.value) {
    return '兩次輸入的密碼不一致'
  }
  return null
}

function switchMode(next: AuthMode) {
  mode.value = next
  localError.value = null
  clearMessages()
}

async function handleSubmit() {
  if (isLoading.value) {
    return
  }

  clearMessages()
  localError.value = validateForm()
  if (localError.value) {
    return
  }

  const credentials = {
    email: email.value.trim(),
    password: password.value,
  }

  try {
    if (mode.value === 'login') {
      await signIn(credentials)
    } else {
      await signUp(credentials)
    }

    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/trips'
    await router.replace(redirect)
  } catch {
    // 錯誤訊息已由 store 處理
  }
}

watch(isAuthenticated, (loggedIn) => {
  if (loggedIn) {
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/trips'
    void router.replace(redirect)
  }
})

onMounted(() => {
  if (isAuthenticated.value) {
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/trips'
    void router.replace(redirect)
  }
})
</script>

<template>
  <section class="page">
    <h1 class="page-title">{{ mode === 'login' ? '登入' : '註冊' }}</h1>
    <p class="page-subtitle">
      給朋友一起用的帳號密碼登入，不需 Email 驗證信。
    </p>

    <div class="card login-card">
      <div class="tabs" role="tablist">
        <button
          type="button"
          class="tab"
          :class="{ active: mode === 'login' }"
          role="tab"
          :aria-selected="mode === 'login'"
          @click="switchMode('login')"
        >
          登入
        </button>
        <button
          type="button"
          class="tab"
          :class="{ active: mode === 'register' }"
          role="tab"
          :aria-selected="mode === 'register'"
          @click="switchMode('register')"
        >
          註冊
        </button>
      </div>

      <form class="login-form" @submit.prevent="handleSubmit">
        <label class="field" for="email">
          <span class="label">Email</span>
          <input
            id="email"
            v-model="email"
            class="input"
            type="email"
            autocomplete="email"
            placeholder="friend@example.com"
            :disabled="isLoading"
            required
          />
        </label>

        <label class="field" for="password">
          <span class="label">密碼</span>
          <input
            id="password"
            v-model="password"
            class="input"
            type="password"
            :autocomplete="mode === 'login' ? 'current-password' : 'new-password'"
            placeholder="至少 6 個字元"
            :disabled="isLoading"
            required
          />
        </label>

        <label v-if="mode === 'register'" class="field" for="confirmPassword">
          <span class="label">確認密碼</span>
          <input
            id="confirmPassword"
            v-model="confirmPassword"
            class="input"
            type="password"
            autocomplete="new-password"
            placeholder="再輸入一次密碼"
            :disabled="isLoading"
            required
          />
        </label>

        <p v-if="localError || errorMessage" class="message-error" role="alert">
          {{ localError || errorMessage }}
        </p>
        <p v-if="successMessage" class="message-success" role="status">
          {{ successMessage }}
        </p>

        <button class="btn btn-primary btn-block" type="submit" :disabled="isLoading">
          {{
            isLoading
              ? '處理中…'
              : mode === 'login'
                ? '登入'
                : '註冊並登入'
          }}
        </button>
      </form>
    </div>
  </section>
</template>

<style scoped>
.login-card {
  border-top: 3px solid var(--color-pink);
}

.tabs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.35rem;
  margin-bottom: 1rem;
  padding: 0.25rem;
  border-radius: var(--radius-sm);
  background: var(--color-purple-soft);
}

.tab {
  min-height: 40px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--color-purple-deep);
  font-weight: 700;
}

.tab.active {
  background: #fff;
  color: var(--color-pink-deep);
  box-shadow: var(--shadow);
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.label {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--color-text);
}
</style>
