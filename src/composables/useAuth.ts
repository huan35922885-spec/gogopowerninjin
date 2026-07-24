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
    isAuthenticated,
    isInitialized,
    isLoading,
    errorMessage,
    successMessage,
  } = storeToRefs(authStore)

  return {
    user,
    isAuthenticated,
    isInitialized,
    isLoading,
    errorMessage,
    successMessage,
    sendMagicLink: authStore.sendMagicLink,
    signOut: authStore.signOut,
    clearMessages: authStore.clearMessages,
  }
}
