import type { ItineraryDayGroup, ItineraryFormValues, ItineraryItem } from '@/types/itinerary'

export interface ItineraryValidationResult {
  ok: boolean
  errors: Partial<Record<keyof ItineraryFormValues, string>>
}

/** 驗證行程表單 */
export function validateItineraryForm(values: ItineraryFormValues): ItineraryValidationResult {
  const errors: ItineraryValidationResult['errors'] = {}

  if (!values.title.trim()) {
    errors.title = '請輸入標題'
  }

  if (!values.category) {
    errors.category = '請選擇分類'
  }

  if (!Number.isInteger(values.day_number) || values.day_number < 1) {
    errors.day_number = '天數必須大於 0'
  }

  if (values.start_time && values.end_time && values.start_time > values.end_time) {
    errors.end_time = '開始時間不得晚於結束時間'
  }

  if (values.map_url.trim()) {
    const url = values.map_url.trim()
    const valid =
      typeof URL.canParse === 'function'
        ? URL.canParse(url)
        : (() => {
            try {
              return Boolean(new URL(url))
            } catch {
              return false
            }
          })()

    if (!valid) {
      errors.map_url = 'Google Maps 網址格式不正確'
    }
  }

  if (!Number.isFinite(values.sort_order)) {
    errors.sort_order = '排序必須是數字'
  }

  return {
    ok: Object.keys(errors).length === 0,
    errors,
  }
}

/** 依開始時間、sort_order 排序 */
export function sortItineraryItems(items: ItineraryItem[]): ItineraryItem[] {
  return [...items].sort((a, b) => {
    const aTime = a.start_time ?? '99:99:99'
    const bTime = b.start_time ?? '99:99:99'
    if (aTime !== bTime) {
      return aTime.localeCompare(bTime)
    }
    return a.sort_order - b.sort_order
  })
}

/** 依 day_number 分組，並補齊旅行天數空白日 */
export function groupItineraryByDay(
  items: ItineraryItem[],
  tripDayCount: number,
): ItineraryDayGroup[] {
  const maxFromItems = items.reduce((max, item) => Math.max(max, item.day_number), 0)
  const totalDays = Math.max(tripDayCount, maxFromItems, 1)

  const groups: ItineraryDayGroup[] = []
  for (let day = 1; day <= totalDays; day += 1) {
    groups.push({
      dayNumber: day,
      items: sortItineraryItems(items.filter((item) => item.day_number === day)),
    })
  }
  return groups
}

/** 計算旅行共幾天（含起迄日） */
export function getTripDayCount(startDate: string, endDate: string): number {
  const start = new Date(`${startDate}T00:00:00`)
  const end = new Date(`${endDate}T00:00:00`)
  const msPerDay = 24 * 60 * 60 * 1000
  const diff = Math.round((end.getTime() - start.getTime()) / msPerDay)
  return Math.max(diff + 1, 1)
}

/** 顯示 HH:MM（Postgres time 可能含秒） */
export function formatTime(value: string | null): string {
  if (!value) {
    return ''
  }
  return value.slice(0, 5)
}

/** 給 input[type=time] 使用的值 */
export function toTimeInputValue(value: string | null): string {
  return formatTime(value)
}
