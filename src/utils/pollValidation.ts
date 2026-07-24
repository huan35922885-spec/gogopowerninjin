import type { PollFormValues, PollOptionDraft } from '@/types/poll'

export function validatePollForm(values: PollFormValues): string | null {
  if (!values.title.trim()) {
    return '請輸入投票標題'
  }

  if (values.title.trim().length > 80) {
    return '標題請在 80 字以內'
  }

  const options = buildOptionDrafts(values)
  if (options.length < 2) {
    return '請至少提供 2 個選項'
  }

  if (options.length > 10) {
    return '選項最多 10 個'
  }

  const labels = options.map((o) => o.label.trim())
  if (labels.some((label) => !label)) {
    return '選項內容不可空白'
  }

  const unique = new Set(labels.map((l) => l.toLowerCase()))
  if (unique.size !== labels.length) {
    return '選項不可重複'
  }

  return null
}

export function buildOptionDrafts(values: PollFormValues): PollOptionDraft[] {
  if (values.optionSource === 'custom') {
    return values.customOptions
      .map((label) => label.trim())
      .filter(Boolean)
      .map((label) => ({ label }))
  }

  // restaurant / itinerary：label 由呼叫端填入 selectedIds 對應名稱前，
  // 這裡只負責檢查數量；實際 drafts 在 composable 組裝。
  return values.selectedIds.map((id) => ({
    label: id,
    restaurant_id: values.optionSource === 'restaurant' ? id : null,
    itinerary_item_id: values.optionSource === 'itinerary' ? id : null,
  }))
}
