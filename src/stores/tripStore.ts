import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type {
  CreateTripInput,
  Trip,
  TripMemberWithProfile,
  TripRole,
  UpdateTripInput,
} from '@/types/trip'
import * as tripService from '@/services/tripService'
import * as memberService from '@/services/memberService'

export const useTripStore = defineStore('trip', () => {
  const trips = ref<Trip[]>([])
  const currentTrip = ref<Trip | null>(null)
  const members = ref<TripMemberWithProfile[]>([])
  const myRole = ref<TripRole | null>(null)

  const isLoading = ref(false)
  const isSaving = ref(false)
  const errorMessage = ref<string | null>(null)
  const successMessage = ref<string | null>(null)

  const hasCurrentTrip = computed(() => currentTrip.value != null)

  function clearMessages() {
    errorMessage.value = null
    successMessage.value = null
  }

  async function fetchTrips() {
    clearMessages()
    isLoading.value = true
    try {
      trips.value = await tripService.listMyTrips()
    } catch (error) {
      errorMessage.value =
        error instanceof Error ? error.message : '無法載入旅行列表'
      throw error
    } finally {
      isLoading.value = false
    }
  }

  async function fetchTripDetail(tripId: string) {
    clearMessages()
    isLoading.value = true
    try {
      const [trip, role, memberList] = await Promise.all([
        tripService.getTripById(tripId),
        memberService.getMyTripRole(tripId),
        memberService.listTripMembers(tripId),
      ])

      if (!trip) {
        currentTrip.value = null
        myRole.value = null
        members.value = []
        errorMessage.value = '找不到此旅行'
        return null
      }

      currentTrip.value = trip
      myRole.value = role
      members.value = memberList
      return trip
    } catch (error) {
      currentTrip.value = null
      myRole.value = null
      members.value = []
      errorMessage.value =
        error instanceof Error ? error.message : '無法載入旅行資料'
      throw error
    } finally {
      isLoading.value = false
    }
  }

  async function createTrip(input: CreateTripInput) {
    clearMessages()
    isSaving.value = true
    try {
      const trip = await tripService.createTrip(input)
      successMessage.value = '旅行建立成功'
      // 列表更新失敗不應讓「建立」本身看起來失敗
      try {
        await fetchTrips()
      } catch (listError) {
        console.warn('[createTrip] trip created but list refresh failed:', listError)
      }
      return trip
    } catch (error) {
      errorMessage.value =
        error instanceof Error ? error.message : '建立旅行失敗'
      throw error
    } finally {
      isSaving.value = false
    }
  }

  async function updateTrip(tripId: string, input: UpdateTripInput) {
    clearMessages()
    isSaving.value = true
    try {
      const trip = await tripService.updateTrip(tripId, input)
      currentTrip.value = trip
      successMessage.value = '旅行資料已更新'
      await fetchTrips()
      return trip
    } catch (error) {
      errorMessage.value =
        error instanceof Error ? error.message : '更新旅行失敗'
      throw error
    } finally {
      isSaving.value = false
    }
  }

  async function deleteTrip(tripId: string) {
    clearMessages()
    isSaving.value = true
    try {
      await tripService.deleteTrip(tripId)
      if (currentTrip.value?.id === tripId) {
        currentTrip.value = null
        myRole.value = null
        members.value = []
      }
      successMessage.value = '旅行已刪除'
      await fetchTrips()
    } catch (error) {
      errorMessage.value =
        error instanceof Error ? error.message : '刪除旅行失敗'
      throw error
    } finally {
      isSaving.value = false
    }
  }

  async function refreshMembers(tripId: string) {
    members.value = await memberService.listTripMembers(tripId)
  }

  async function addMember(tripId: string, userId: string, role: TripRole) {
    clearMessages()
    isSaving.value = true
    try {
      await memberService.addMemberByUserId(tripId, userId, role)
      successMessage.value = '成員已新增'
      await refreshMembers(tripId)
    } catch (error) {
      errorMessage.value =
        error instanceof Error ? error.message : '新增成員失敗'
      throw error
    } finally {
      isSaving.value = false
    }
  }

  async function changeMemberRole(tripId: string, memberId: string, role: TripRole) {
    clearMessages()
    isSaving.value = true
    try {
      await memberService.updateMemberRole(memberId, role)
      successMessage.value = '角色已更新'
      await refreshMembers(tripId)
    } catch (error) {
      errorMessage.value =
        error instanceof Error ? error.message : '更新角色失敗'
      throw error
    } finally {
      isSaving.value = false
    }
  }

  async function removeMember(tripId: string, memberId: string) {
    clearMessages()
    isSaving.value = true
    try {
      await memberService.removeMember(memberId)
      successMessage.value = '成員已移除'
      await refreshMembers(tripId)
    } catch (error) {
      errorMessage.value =
        error instanceof Error ? error.message : '移除成員失敗'
      throw error
    } finally {
      isSaving.value = false
    }
  }

  function clearCurrentTrip() {
    currentTrip.value = null
    myRole.value = null
    members.value = []
  }

  return {
    trips,
    currentTrip,
    members,
    myRole,
    isLoading,
    isSaving,
    errorMessage,
    successMessage,
    hasCurrentTrip,
    clearMessages,
    fetchTrips,
    fetchTripDetail,
    createTrip,
    updateTrip,
    deleteTrip,
    addMember,
    changeMemberRole,
    removeMember,
    clearCurrentTrip,
  }
})
