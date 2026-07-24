import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { Session } from '@supabase/supabase-js'
import type { AuthUser } from '@/types/auth'
import * as authService from '@/services/authService'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUser | null>(null)
  const session = ref<Session | null>(null)
  const isInitialized = ref(false)
  const isLoading = ref(false)
  const errorMessage = ref<string | null>(null)
  const successMessage = ref<string | null>(null)

  let unsubscribe: (() => void) | null = null

  const isAuthenticated = computed(() => session.value != null && user.value != null)

  function applySession(nextSession: Session | null) {
    session.value = nextSession
    user.value = authService.mapSessionUser(nextSession)
  }

  function clearMessages() {
    errorMessage.value = null
    successMessage.value = null
  }

  /** 應用程式啟動時呼叫一次：恢復 session 並監聽後續變化 */
  async function initialize() {
    if (isInitialized.value) {
      return
    }

    try {
      const current = await authService.getSession()
      applySession(current)

      unsubscribe = authService.onAuthStateChange((_event, nextSession) => {
        applySession(nextSession)
      })
    } catch (error) {
      applySession(null)
      errorMessage.value =
        error instanceof Error ? error.message : '無法初始化登入狀態'
    } finally {
      isInitialized.value = true
    }
  }

  async function sendMagicLink(email: string) {
    clearMessages()
    isLoading.value = true

    try {
      await authService.sendMagicLink(email)
      successMessage.value = '登入連結已寄出，請到信箱點擊連結完成登入。'
    } catch (error) {
      errorMessage.value =
        error instanceof Error ? error.message : '無法發送登入連結，請稍後再試'
      throw error
    } finally {
      isLoading.value = false
    }
  }

  async function signOut() {
    clearMessages()
    isLoading.value = true

    try {
      await authService.signOut()
      applySession(null)
      successMessage.value = '已成功登出。'
    } catch (error) {
      errorMessage.value =
        error instanceof Error ? error.message : '登出失敗，請稍後再試'
      throw error
    } finally {
      isLoading.value = false
    }
  }

  function dispose() {
    if (unsubscribe) {
      unsubscribe()
      unsubscribe = null
    }
  }

  return {
    user,
    session,
    isInitialized,
    isLoading,
    errorMessage,
    successMessage,
    isAuthenticated,
    initialize,
    sendMagicLink,
    signOut,
    clearMessages,
    dispose,
  }
})
