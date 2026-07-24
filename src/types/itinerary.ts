/** 行程分類（與資料庫 check constraint 一致） */
export const ITINERARY_CATEGORIES = [
  '景點',
  '早餐',
  '午餐',
  '晚餐',
  '住宿',
  '交通',
  '購物',
  '其他',
] as const

export type ItineraryCategory = (typeof ITINERARY_CATEGORIES)[number]

export interface ItineraryItem {
  id: string
  trip_id: string
  day_number: number
  start_time: string | null
  end_time: string | null
  title: string
  location: string | null
  category: ItineraryCategory
  description: string | null
  map_url: string | null
  sort_order: number
  created_by: string
  updated_by: string | null
  created_at: string
  updated_at: string
}

export interface ItineraryFormValues {
  day_number: number
  start_time: string
  end_time: string
  title: string
  location: string
  category: ItineraryCategory
  description: string
  map_url: string
  sort_order: number
}

export interface CreateItineraryInput {
  trip_id: string
  day_number: number
  start_time?: string | null
  end_time?: string | null
  title: string
  location?: string | null
  category: ItineraryCategory
  description?: string | null
  map_url?: string | null
  sort_order?: number
  created_by: string
}

export interface UpdateItineraryInput {
  day_number: number
  start_time?: string | null
  end_time?: string | null
  title: string
  location?: string | null
  category: ItineraryCategory
  description?: string | null
  map_url?: string | null
  sort_order?: number
  updated_by: string
}

export interface ItineraryDayGroup {
  dayNumber: number
  items: ItineraryItem[]
}
