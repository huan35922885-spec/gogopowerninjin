import type { TripFormValues } from '@/types/trip'

export interface ValidationResult {
  ok: boolean
  errors: Partial<Record<keyof TripFormValues, string>>
}

/** 驗證旅行表單：必填、日期先後 */
export function validateTripForm(values: TripFormValues): ValidationResult {
  const errors: ValidationResult['errors'] = {}

  if (!values.title.trim()) {
    errors.title = '請輸入旅行名稱'
  }

  if (!values.start_date) {
    errors.start_date = '請選擇開始日期'
  }

  if (!values.end_date) {
    errors.end_date = '請選擇結束日期'
  }

  if (values.start_date && values.end_date && values.start_date > values.end_date) {
    errors.end_date = '開始日期不得晚於結束日期'
  }

  if (values.cover_image_url.trim()) {
    const url = values.cover_image_url.trim()
    const valid = typeof URL.canParse === 'function'
      ? URL.canParse(url)
      : (() => {
          try {
            return Boolean(new URL(url))
          } catch {
            return false
          }
        })()

    if (!valid) {
      errors.cover_image_url = '封面圖片網址格式不正確'
    }
  }

  return {
    ok: Object.keys(errors).length === 0,
    errors,
  }
}

/** 計算距離出發日的倒數（負數表示已開始／已結束） */
export function getCountdownDays(startDate: string, endDate: string): {
  label: string
  days: number
} {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const start = new Date(`${startDate}T00:00:00`)
  const end = new Date(`${endDate}T00:00:00`)

  const msPerDay = 24 * 60 * 60 * 1000
  const toStart = Math.round((start.getTime() - today.getTime()) / msPerDay)
  const toEnd = Math.round((end.getTime() - today.getTime()) / msPerDay)

  if (toStart > 0) {
    return { label: `還有 ${toStart} 天出發`, days: toStart }
  }

  if (toEnd >= 0) {
    return { label: '旅行進行中', days: 0 }
  }

  return { label: '旅行已結束', days: toEnd }
}

export function formatDateRange(startDate: string, endDate: string): string {
  return `${startDate} ～ ${endDate}`
}
