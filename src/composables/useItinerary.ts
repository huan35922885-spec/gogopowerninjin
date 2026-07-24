import { computed, ref, type Ref } from 'vue'
import type { ItineraryFormValues, ItineraryItem } from '@/types/itinerary'
import * as itineraryService from '@/services/itineraryService'
import { groupItineraryByDay, getTripDayCount } from '@/utils/itineraryHelpers'
import { useAuthStore } from '@/stores/authStore'

/**
 * 行程資料流程。
 * 元件請透過此 composable 操作，不要直接呼叫 Supabase。
 */
export function useItinerary(
  tripId: Ref<string>,
  tripDates: Ref<{ start_date: string; end_date: string } | null>,
) {
  const authStore = useAuthStore()

  const items = ref<ItineraryItem[]>([])
  const isLoading = ref(false)
  const isSaving = ref(false)
  const errorMessage = ref<string | null>(null)
  const successMessage = ref<string | null>(null)

  const tripDayCount = computed(() => {
    if (!tripDates.value) {
      return 1
    }
    return getTripDayCount(tripDates.value.start_date, tripDates.value.end_date)
  })

  const dayGroups = computed(() => groupItineraryByDay(items.value, tripDayCount.value))

  function clearMessages() {
    errorMessage.value = null
    successMessage.value = null
  }

  async function fetchItems() {
    clearMessages()
    isLoading.value = true
    try {
      items.value = await itineraryService.listItineraryItems(tripId.value)
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : '無法載入行程'
      throw error
    } finally {
      isLoading.value = false
    }
  }

  async function createItem(values: ItineraryFormValues) {
    const userId = authStore.user?.id
    if (!userId) {
      throw new Error('請先登入')
    }

    clearMessages()
    isSaving.value = true
    try {
      const created = await itineraryService.createItineraryItem({
        trip_id: tripId.value,
        day_number: values.day_number,
        start_time: values.start_time || null,
        end_time: values.end_time || null,
        title: values.title,
        location: values.location || null,
        category: values.category,
        description: values.description || null,
        map_url: values.map_url || null,
        sort_order: values.sort_order,
        created_by: userId,
      })
      items.value = [...items.value, created]
      successMessage.value = '行程已新增'
      return created
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : '新增行程失敗'
      throw error
    } finally {
      isSaving.value = false
    }
  }

  async function updateItem(itemId: string, values: ItineraryFormValues) {
    const userId = authStore.user?.id
    if (!userId) {
      throw new Error('請先登入')
    }

    clearMessages()
    isSaving.value = true
    try {
      const updated = await itineraryService.updateItineraryItem(itemId, {
        day_number: values.day_number,
        start_time: values.start_time || null,
        end_time: values.end_time || null,
        title: values.title,
        location: values.location || null,
        category: values.category,
        description: values.description || null,
        map_url: values.map_url || null,
        sort_order: values.sort_order,
        updated_by: userId,
      })
      items.value = items.value.map((item) => (item.id === itemId ? updated : item))
      successMessage.value = '行程已更新'
      return updated
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : '更新行程失敗'
      throw error
    } finally {
      isSaving.value = false
    }
  }

  async function deleteItem(itemId: string) {
    clearMessages()
    isSaving.value = true
    try {
      await itineraryService.deleteItineraryItem(itemId)
      items.value = items.value.filter((item) => item.id !== itemId)
      successMessage.value = '行程已刪除'
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : '刪除行程失敗'
      throw error
    } finally {
      isSaving.value = false
    }
  }

  return {
    items,
    dayGroups,
    tripDayCount,
    isLoading,
    isSaving,
    errorMessage,
    successMessage,
    clearMessages,
    fetchItems,
    createItem,
    updateItem,
    deleteItem,
  }
}
