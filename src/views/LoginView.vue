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
  // 簡單驗證即可，第一版不引入表單套件
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

    <div class="card">
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

        <p v-if="localError || errorMessage" class="message message-error" role="alert">
          {{ localError || errorMessage }}
        </p>
        <p v-if="successMessage" class="message message-success" role="status">
          {{ successMessage }}
        </p>

        <button class="submit" type="submit" :disabled="isLoading">
          {{ isLoading ? '傳送中…' : '寄送登入連結' }}
        </button>
      </form>
    </div>
  </section>
</template>

<style scoped>
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
  font-weight: 600;
  color: var(--color-text);
}

.input {
  width: 100%;
  min-height: 44px;
  padding: 0.65rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  font: inherit;
  background: #fff;
  color: var(--color-text);
}

.input:focus {
  outline: 2px solid var(--color-primary-soft);
  border-color: var(--color-primary);
}

.input:disabled {
  opacity: 0.7;
}

.message {
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.4;
}

.message-error {
  color: var(--color-danger);
}

.message-success {
  color: var(--color-primary);
}

.submit {
  min-height: 48px;
  border: none;
  border-radius: 10px;
  background: var(--color-primary);
  color: #fff;
  font-weight: 600;
  font-size: 1rem;
}

.submit:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}
</style>
