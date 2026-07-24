import { computed, ref, type Ref } from 'vue'
import type { ChecklistFormValues, ChecklistItem } from '@/types/checklist'
import * as checklistService from '@/services/checklistService'
import { useAuthStore } from '@/stores/authStore'

/**
 * 行李清單資料流程。
 * 元件請透過此 composable 操作，不要直接呼叫 Supabase。
 */
export function useChecklist(tripId: Ref<string>) {
  const authStore = useAuthStore()

  const items = ref<ChecklistItem[]>([])
  const isLoading = ref(false)
  const isSaving = ref(false)
  const errorMessage = ref<string | null>(null)
  const successMessage = ref<string | null>(null)

  const pendingItems = computed(() => items.value.filter((item) => !item.is_completed))
  const completedItems = computed(() => items.value.filter((item) => item.is_completed))

  function clearMessages() {
    errorMessage.value = null
    successMessage.value = null
  }

  function sortItems(list: ChecklistItem[]): ChecklistItem[] {
    return [...list].sort((a, b) => {
      if (a.is_completed !== b.is_completed) {
        return a.is_completed ? 1 : -1
      }
      return a.created_at.localeCompare(b.created_at)
    })
  }

  async function fetchItems() {
    clearMessages()
    isLoading.value = true
    try {
      items.value = sortItems(await checklistService.listChecklistItems(tripId.value))
    } catch (error) {
      errorMessage.value =
        error instanceof Error ? error.message : '無法載入行李清單'
      throw error
    } finally {
      isLoading.value = false
    }
  }

  async function createItem(values: ChecklistFormValues) {
    const userId = authStore.user?.id
    if (!userId) {
      throw new Error('請先登入')
    }

    clearMessages()
    isSaving.value = true
    try {
      const created = await checklistService.createChecklistItem({
        trip_id: tripId.value,
        content: values.content,
        assigned_to: values.assigned_to || null,
        created_by: userId,
      })
      items.value = sortItems([...items.value, created])
      successMessage.value = '項目已新增'
      return created
    } catch (error) {
      errorMessage.value =
        error instanceof Error ? error.message : '新增項目失敗'
      throw error
    } finally {
      isSaving.value = false
    }
  }

  async function updateItem(itemId: string, values: ChecklistFormValues) {
    clearMessages()
    isSaving.value = true
    try {
      const updated = await checklistService.updateChecklistItem(itemId, {
        content: values.content,
        assigned_to: values.assigned_to || null,
      })
      items.value = sortItems(
        items.value.map((item) => (item.id === itemId ? updated : item)),
      )
      successMessage.value = '項目已更新'
      return updated
    } catch (error) {
      errorMessage.value =
        error instanceof Error ? error.message : '更新項目失敗'
      throw error
    } finally {
      isSaving.value = false
    }
  }

  async function toggleCompleted(itemId: string, isCompleted: boolean) {
    clearMessages()
    isSaving.value = true
    try {
      const updated = await checklistService.updateChecklistItem(itemId, {
        is_completed: isCompleted,
      })
      items.value = sortItems(
        items.value.map((item) => (item.id === itemId ? updated : item)),
      )
    } catch (error) {
      errorMessage.value =
        error instanceof Error ? error.message : '更新完成狀態失敗'
      throw error
    } finally {
      isSaving.value = false
    }
  }

  async function deleteItem(itemId: string) {
    clearMessages()
    isSaving.value = true
    try {
      await checklistService.deleteChecklistItem(itemId)
      items.value = items.value.filter((item) => item.id !== itemId)
      successMessage.value = '項目已刪除'
    } catch (error) {
      errorMessage.value =
        error instanceof Error ? error.message : '刪除項目失敗'
      throw error
    } finally {
      isSaving.value = false
    }
  }

  return {
    items,
    pendingItems,
    completedItems,
    isLoading,
    isSaving,
    errorMessage,
    successMessage,
    clearMessages,
    fetchItems,
    createItem,
    updateItem,
    toggleCompleted,
    deleteItem,
  }
}
