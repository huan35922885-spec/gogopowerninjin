import type { RestaurantFormValues } from '@/types/restaurant'

export interface RestaurantValidationResult {
  ok: boolean
  errors: Partial<Record<keyof RestaurantFormValues, string>>
}

export function validateRestaurantForm(
  values: RestaurantFormValues,
): RestaurantValidationResult {
  const errors: RestaurantValidationResult['errors'] = {}

  if (!values.name.trim()) {
    errors.name = '請輸入餐廳名稱'
  }

  if (!values.status) {
    errors.status = '請選擇狀態'
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

  return {
    ok: Object.keys(errors).length === 0,
    errors,
  }
}
