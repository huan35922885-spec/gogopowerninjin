/** 用餐類型 */
export const MEAL_TYPES = ['早餐', '午餐', '晚餐', '宵夜', '甜點'] as const
export type MealType = (typeof MEAL_TYPES)[number]

/** 餐廳狀態（資料庫英文值） */
export const RESTAURANT_STATUSES = ['candidate', 'selected', 'rejected'] as const
export type RestaurantStatus = (typeof RESTAURANT_STATUSES)[number]

export const RESTAURANT_STATUS_LABELS: Record<RestaurantStatus, string> = {
  candidate: '候選',
  selected: '已選擇',
  rejected: '不採用',
}

export interface Restaurant {
  id: string
  trip_id: string
  name: string
  meal_type: MealType | null
  address: string | null
  budget: string | null
  map_url: string | null
  status: RestaurantStatus
  note: string | null
  created_by: string
  created_at: string
  updated_at: string
}

export interface RestaurantFormValues {
  name: string
  meal_type: MealType | ''
  address: string
  budget: string
  map_url: string
  status: RestaurantStatus
  note: string
}

export interface CreateRestaurantInput {
  trip_id: string
  name: string
  meal_type?: MealType | null
  address?: string | null
  budget?: string | null
  map_url?: string | null
  status?: RestaurantStatus
  note?: string | null
  created_by: string
}

export interface UpdateRestaurantInput {
  name: string
  meal_type?: MealType | null
  address?: string | null
  budget?: string | null
  map_url?: string | null
  status: RestaurantStatus
  note?: string | null
}
