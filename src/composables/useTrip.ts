import { storeToRefs } from 'pinia'
import { useTripStore } from '@/stores/tripStore'

/**
 * 旅行資料流程。
 * 元件請透過此 composable 操作，不要直接呼叫 Supabase。
 */
export function useTrip() {
  const tripStore = useTripStore()
  const {
    trips,
    currentTrip,
    members,
    myRole,
    isLoading,
    isSaving,
    errorMessage,
    successMessage,
  } = storeToRefs(tripStore)

  return {
    trips,
    currentTrip,
    members,
    myRole,
    isLoading,
    isSaving,
    errorMessage,
    successMessage,
    fetchTrips: tripStore.fetchTrips,
    fetchTripDetail: tripStore.fetchTripDetail,
    createTrip: tripStore.createTrip,
    updateTrip: tripStore.updateTrip,
    deleteTrip: tripStore.deleteTrip,
    addMember: tripStore.addMember,
    changeMemberRole: tripStore.changeMemberRole,
    removeMember: tripStore.removeMember,
    clearCurrentTrip: tripStore.clearCurrentTrip,
    clearMessages: tripStore.clearMessages,
  }
}
