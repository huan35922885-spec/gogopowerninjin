import { ref, type Ref } from 'vue'
import type { Restaurant, RestaurantFormValues } from '@/types/restaurant'
import * as restaurantService from '@/services/restaurantService'
import { useAuthStore } from '@/stores/authStore'

/**
 * 餐廳候選資料流程。
 * 元件請透過此 composable 操作，不要直接呼叫 Supabase。
 */
export function useRestaurants(tripId: Ref<string>) {
  const authStore = useAuthStore()

  const restaurants = ref<Restaurant[]>([])
  const isLoading = ref(false)
  const isSaving = ref(false)
  const errorMessage = ref<string | null>(null)
  const successMessage = ref<string | null>(null)

  function clearMessages() {
    errorMessage.value = null
    successMessage.value = null
  }

  async function fetchRestaurants() {
    clearMessages()
    isLoading.value = true
    try {
      restaurants.value = await restaurantService.listRestaurants(tripId.value)
    } catch (error) {
      errorMessage.value =
        error instanceof Error ? error.message : '無法載入餐廳列表'
      throw error
    } finally {
      isLoading.value = false
    }
  }

  async function createRestaurant(values: RestaurantFormValues) {
    const userId = authStore.user?.id
    if (!userId) {
      throw new Error('請先登入')
    }

    clearMessages()
    isSaving.value = true
    try {
      const created = await restaurantService.createRestaurant({
        trip_id: tripId.value,
        name: values.name,
        meal_type: values.meal_type || null,
        address: values.address || null,
        budget: values.budget || null,
        map_url: values.map_url || null,
        status: values.status,
        note: values.note || null,
        created_by: userId,
      })
      restaurants.value = [created, ...restaurants.value]
      successMessage.value = '餐廳已新增'
      return created
    } catch (error) {
      errorMessage.value =
        error instanceof Error ? error.message : '新增餐廳失敗'
      throw error
    } finally {
      isSaving.value = false
    }
  }

  async function updateRestaurant(restaurantId: string, values: RestaurantFormValues) {
    clearMessages()
    isSaving.value = true
    try {
      const updated = await restaurantService.updateRestaurant(restaurantId, {
        name: values.name,
        meal_type: values.meal_type || null,
        address: values.address || null,
        budget: values.budget || null,
        map_url: values.map_url || null,
        status: values.status,
        note: values.note || null,
      })
      restaurants.value = restaurants.value.map((item) =>
        item.id === restaurantId ? updated : item,
      )
      successMessage.value = '餐廳已更新'
      return updated
    } catch (error) {
      errorMessage.value =
        error instanceof Error ? error.message : '更新餐廳失敗'
      throw error
    } finally {
      isSaving.value = false
    }
  }

  async function deleteRestaurant(restaurantId: string) {
    clearMessages()
    isSaving.value = true
    try {
      await restaurantService.deleteRestaurant(restaurantId)
      restaurants.value = restaurants.value.filter((item) => item.id !== restaurantId)
      successMessage.value = '餐廳已刪除'
    } catch (error) {
      errorMessage.value =
        error instanceof Error ? error.message : '刪除餐廳失敗'
      throw error
    } finally {
      isSaving.value = false
    }
  }

  return {
    restaurants,
    isLoading,
    isSaving,
    errorMessage,
    successMessage,
    clearMessages,
    fetchRestaurants,
    createRestaurant,
    updateRestaurant,
    deleteRestaurant,
  }
}
