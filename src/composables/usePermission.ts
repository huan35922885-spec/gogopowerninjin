import { computed, type Ref } from 'vue'
import type { TripRole } from '@/types/trip'

/**
 * 前端權限判斷（UX 用）。
 * 真正的權限仍由 Supabase RLS 控制。
 */
export function usePermission(role: Ref<TripRole | null | undefined>) {
  const canView = computed(() => role.value != null)

  const canEditContent = computed(
    () => role.value === 'owner' || role.value === 'editor',
  )

  const canEditTrip = computed(() => role.value === 'owner')

  const canDeleteTrip = computed(() => role.value === 'owner')

  const canManageMembers = computed(() => role.value === 'owner')

  return {
    canView,
    canEditContent,
    canEditTrip,
    canDeleteTrip,
    canManageMembers,
  }
}
