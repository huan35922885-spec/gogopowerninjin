import { ref, type Ref } from 'vue'
import type { CreatePollInput, Poll, PollFormValues, PollOptionDraft } from '@/types/poll'
import * as pollService from '@/services/pollService'
import { useAuthStore } from '@/stores/authStore'
import { buildOptionDrafts } from '@/utils/pollValidation'

/**
 * 旅行投票資料流程。
 * 元件請透過此 composable 操作，不要直接呼叫 Supabase。
 */
export function usePolls(tripId: Ref<string>) {
  const authStore = useAuthStore()

  const polls = ref<Poll[]>([])
  const isLoading = ref(false)
  const isSaving = ref(false)
  const errorMessage = ref<string | null>(null)
  const successMessage = ref<string | null>(null)

  function clearMessages() {
    errorMessage.value = null
    successMessage.value = null
  }

  async function fetchPolls() {
    clearMessages()
    isLoading.value = true
    try {
      polls.value = await pollService.listPolls(tripId.value, authStore.user?.id ?? null)
    } catch (error) {
      errorMessage.value =
        error instanceof Error ? error.message : '無法載入投票列表'
      throw error
    } finally {
      isLoading.value = false
    }
  }

  function resolveOptions(
    values: PollFormValues,
    restaurants: { id: string; name: string }[],
    itineraryItems: { id: string; title: string }[],
  ): PollOptionDraft[] {
    if (values.optionSource === 'custom') {
      return buildOptionDrafts(values)
    }

    if (values.optionSource === 'restaurant') {
      const drafts: PollOptionDraft[] = []
      for (const id of values.selectedIds) {
        const restaurant = restaurants.find((item) => item.id === id)
        if (restaurant) {
          drafts.push({
            label: restaurant.name,
            restaurant_id: restaurant.id,
            itinerary_item_id: null,
          })
        }
      }
      return drafts
    }

    const drafts: PollOptionDraft[] = []
    for (const id of values.selectedIds) {
      const item = itineraryItems.find((row) => row.id === id)
      if (item) {
        drafts.push({
          label: item.title,
          restaurant_id: null,
          itinerary_item_id: item.id,
        })
      }
    }
    return drafts
  }

  async function createPoll(
    values: PollFormValues,
    restaurants: { id: string; name: string }[],
    itineraryItems: { id: string; title: string }[],
  ) {
    const userId = authStore.user?.id
    if (!userId) {
      throw new Error('請先登入')
    }

    const options = resolveOptions(values, restaurants, itineraryItems)
    if (options.length < 2) {
      throw new Error('請至少提供 2 個選項')
    }

    clearMessages()
    isSaving.value = true
    try {
      const input: CreatePollInput = {
        trip_id: tripId.value,
        title: values.title,
        description: values.description || null,
        options,
      }
      await pollService.createPoll(input)
      polls.value = await pollService.listPolls(tripId.value, authStore.user?.id ?? null)
      successMessage.value = '投票已建立'
    } catch (error) {
      errorMessage.value =
        error instanceof Error ? error.message : '建立投票失敗'
      throw error
    } finally {
      isSaving.value = false
    }
  }

  async function castVote(pollId: string, optionId: string) {
    clearMessages()
    isSaving.value = true
    try {
      await pollService.castVote(pollId, optionId)
      polls.value = await pollService.listPolls(tripId.value, authStore.user?.id ?? null)
      successMessage.value = '已投票'
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : '投票失敗'
      throw error
    } finally {
      isSaving.value = false
    }
  }

  async function closePoll(pollId: string) {
    clearMessages()
    isSaving.value = true
    try {
      await pollService.closePoll(pollId)
      polls.value = await pollService.listPolls(tripId.value, authStore.user?.id ?? null)
      successMessage.value = '投票已結束'
    } catch (error) {
      errorMessage.value =
        error instanceof Error ? error.message : '結束投票失敗'
      throw error
    } finally {
      isSaving.value = false
    }
  }

  async function deletePoll(pollId: string) {
    clearMessages()
    isSaving.value = true
    try {
      await pollService.deletePoll(pollId)
      polls.value = polls.value.filter((poll) => poll.id !== pollId)
      successMessage.value = '投票已刪除'
    } catch (error) {
      errorMessage.value =
        error instanceof Error ? error.message : '刪除投票失敗'
      throw error
    } finally {
      isSaving.value = false
    }
  }

  return {
    polls,
    isLoading,
    isSaving,
    errorMessage,
    successMessage,
    clearMessages,
    fetchPolls,
    createPoll,
    castVote,
    closePoll,
    deletePoll,
  }
}
