<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

const route = useRoute()
const router = useRouter()
const {
  isAuthenticated,
  isLoading,
  errorMessage,
  successMessage,
  sendMagicLink,
  clearMessages,
} = useAuth()

const email = ref('')
const localError = ref<string | null>(null)

function validateEmail(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) {
    return '請輸入 Email'
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return 'Email 格式不正確'
  }
  return null
}

async function handleSubmit() {
  if (isLoading.value) {
    return
  }

  clearMessages()
  localError.value = validateEmail(email.value)
  if (localError.value) {
    return
  }

  try {
    await sendMagicLink(email.value)
  } catch {
    // 錯誤訊息已由 store 處理
  }
}

onMounted(() => {
  if (isAuthenticated.value) {
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/trips'
    void router.replace(redirect)
  }
})
</script>

<template>
  <section class="page">
    <h1 class="page-title">登入</h1>
    <p class="page-subtitle">輸入 Email，我們會寄送 Magic Link 給你。</p>

    <div class="card login-card">
      <form class="login-form" @submit.prevent="handleSubmit">
        <label class="field" for="email">
          <span class="label">Email</span>
          <input
            id="email"
            v-model="email"
            class="input"
            type="email"
            autocomplete="email"
            placeholder="you@example.com"
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
          {{ isLoading ? '傳送中…' : '寄送登入連結' }}
        </button>
      </form>
    </div>
  </section>
</template>

<style scoped>
.login-card {
  border-top: 3px solid var(--color-pink);
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
