import { supabase } from '@/lib/supabaseClient'
import { toReadableError } from '@/utils/errors'
import type {
  CreateRestaurantInput,
  Restaurant,
  UpdateRestaurantInput,
} from '@/types/restaurant'

/** 取得旅行的餐廳候選列表 */
export async function listRestaurants(tripId: string): Promise<Restaurant[]> {
  const { data, error } = await supabase
    .from('restaurants')
    .select('*')
    .eq('trip_id', tripId)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(toReadableError(error, '無法載入餐廳列表'))
  }

  return (data ?? []) as Restaurant[]
}

/** 新增餐廳 */
export async function createRestaurant(input: CreateRestaurantInput): Promise<Restaurant> {
  const { data, error } = await supabase
    .from('restaurants')
    .insert({
      trip_id: input.trip_id,
      name: input.name.trim(),
      meal_type: input.meal_type || null,
      address: input.address?.trim() || null,
      budget: input.budget?.trim() || null,
      map_url: input.map_url?.trim() || null,
      status: input.status ?? 'candidate',
      note: input.note?.trim() || null,
      created_by: input.created_by,
    })
    .select('*')
    .single()

  if (error) {
    throw new Error(toReadableError(error, '新增餐廳失敗'))
  }

  return data as Restaurant
}

/** 更新餐廳 */
export async function updateRestaurant(
  restaurantId: string,
  input: UpdateRestaurantInput,
): Promise<Restaurant> {
  const { data, error } = await supabase
    .from('restaurants')
    .update({
      name: input.name.trim(),
      meal_type: input.meal_type || null,
      address: input.address?.trim() || null,
      budget: input.budget?.trim() || null,
      map_url: input.map_url?.trim() || null,
      status: input.status,
      note: input.note?.trim() || null,
    })
    .eq('id', restaurantId)
    .select('*')
    .single()

  if (error) {
    throw new Error(toReadableError(error, '更新餐廳失敗'))
  }

  return data as Restaurant
}

/** 刪除餐廳 */
export async function deleteRestaurant(restaurantId: string): Promise<void> {
  const { error } = await supabase.from('restaurants').delete().eq('id', restaurantId)

  if (error) {
    throw new Error(toReadableError(error, '刪除餐廳失敗'))
  }
}
