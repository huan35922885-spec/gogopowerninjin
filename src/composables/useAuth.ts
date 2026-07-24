import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/stores/authStore'

/**
 * 畫面層使用的認證流程。
 * 元件請呼叫此 composable，不要直接操作 Supabase。
 */
export function useAuth() {
  const authStore = useAuthStore()
  const {
    user,
    profile,
    isAuthenticated,
    isInitialized,
    isLoading,
    isSavingProfile,
    errorMessage,
    successMessage,
    displayLabel,
  } = storeToRefs(authStore)

  return {
    user,
    profile,
    isAuthenticated,
    isInitialized,
    isLoading,
    isSavingProfile,
    errorMessage,
    successMessage,
    displayLabel,
    signIn: authStore.signIn,
    signUp: authStore.signUp,
    signOut: authStore.signOut,
    loadProfile: authStore.loadProfile,
    updateMyProfile: authStore.updateMyProfile,
    clearMessages: authStore.clearMessages,
  }
}
