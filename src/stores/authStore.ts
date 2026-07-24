import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { Session } from '@supabase/supabase-js'
import type { AuthCredentials, AuthUser } from '@/types/auth'
import type { UserProfile } from '@/types/profile'
import * as authService from '@/services/authService'
import * as profileService from '@/services/profileService'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUser | null>(null)
  const session = ref<Session | null>(null)
  const profile = ref<UserProfile | null>(null)
  const isInitialized = ref(false)
  const isLoading = ref(false)
  const isSavingProfile = ref(false)
  const errorMessage = ref<string | null>(null)
  const successMessage = ref<string | null>(null)

  let unsubscribe: (() => void) | null = null

  const isAuthenticated = computed(() => session.value != null && user.value != null)

  const displayLabel = computed(() => {
    return profile.value?.display_name || user.value?.email || '旅人'
  })

  function applySession(nextSession: Session | null) {
    session.value = nextSession
    user.value = authService.mapSessionUser(nextSession)
    if (!nextSession) {
      profile.value = null
    }
  }

  function clearMessages() {
    errorMessage.value = null
    successMessage.value = null
  }

  async function loadProfile() {
    if (!user.value) {
      profile.value = null
      return null
    }

    try {
      profile.value = await profileService.getProfile(user.value.id)
      return profile.value
    } catch (error) {
      console.warn('[loadProfile]', error)
      return null
    }
  }

  /** 應用程式啟動時呼叫一次：恢復 session 並監聽後續變化 */
  async function initialize() {
    if (isInitialized.value) {
      return
    }

    try {
      const current = await authService.getSession()
      applySession(current)
      if (current) {
        await loadProfile()
      }

      unsubscribe = authService.onAuthStateChange((_event, nextSession) => {
        applySession(nextSession)
        if (nextSession) {
          void loadProfile()
        }
      })
    } catch (error) {
      applySession(null)
      errorMessage.value =
        error instanceof Error ? error.message : '無法初始化登入狀態'
    } finally {
      isInitialized.value = true
    }
  }

  async function signIn(credentials: AuthCredentials) {
    clearMessages()
    isLoading.value = true

    try {
      const nextSession = await authService.signInWithPassword(credentials)
      applySession(nextSession)
      await loadProfile()
      successMessage.value = '登入成功'
      return nextSession
    } catch (error) {
      errorMessage.value =
        error instanceof Error ? error.message : '登入失敗，請稍後再試'
      throw error
    } finally {
      isLoading.value = false
    }
  }

  async function signUp(credentials: AuthCredentials) {
    clearMessages()
    isLoading.value = true

    try {
      const nextSession = await authService.signUpWithPassword(credentials)
      applySession(nextSession)
      await loadProfile()
      successMessage.value = '註冊成功，已自動登入'
      return nextSession
    } catch (error) {
      errorMessage.value =
        error instanceof Error ? error.message : '註冊失敗，請稍後再試'
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

  async function updateMyProfile(input: {
    display_name: string
    avatar_url?: string | null
    avatarFile?: File | null
  }) {
    if (!user.value) {
      throw new Error('請先登入')
    }

    clearMessages()
    isSavingProfile.value = true

    try {
      let avatarUrl: string | null

      if (input.avatarFile) {
        avatarUrl = await profileService.uploadAvatar(user.value.id, input.avatarFile)
      } else if (input.avatar_url !== undefined) {
        // 明確傳入（含 null／空字串）＝可清除頭貼；未傳則保留原值
        avatarUrl = input.avatar_url?.trim() || null
      } else {
        avatarUrl = profile.value?.avatar_url ?? null
      }

      profile.value = await profileService.updateProfile(user.value.id, {
        display_name: input.display_name,
        avatar_url: avatarUrl,
      })
      successMessage.value = '個人資料已更新'
      return profile.value
    } catch (error) {
      errorMessage.value =
        error instanceof Error ? error.message : '更新個人資料失敗'
      throw error
    } finally {
      isSavingProfile.value = false
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
    profile,
    isInitialized,
    isLoading,
    isSavingProfile,
    errorMessage,
    successMessage,
    isAuthenticated,
    displayLabel,
    initialize,
    signIn,
    signUp,
    signOut,
    loadProfile,
    updateMyProfile,
    clearMessages,
    dispose,
  }
})
