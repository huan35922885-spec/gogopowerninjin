import { supabase } from '@/lib/supabaseClient'
import { toReadableError } from '@/utils/errors'
import type {
  CreateItineraryInput,
  ItineraryItem,
  UpdateItineraryInput,
} from '@/types/itinerary'

/** 取得旅行的所有行程項目 */
export async function listItineraryItems(tripId: string): Promise<ItineraryItem[]> {
  const { data, error } = await supabase
    .from('itinerary_items')
    .select('*')
    .eq('trip_id', tripId)

  if (error) {
    throw new Error(toReadableError(error, '無法載入行程'))
  }

  return (data ?? []) as ItineraryItem[]
}

/** 新增行程項目 */
export async function createItineraryItem(
  input: CreateItineraryInput,
): Promise<ItineraryItem> {
  const { data, error } = await supabase
    .from('itinerary_items')
    .insert({
      trip_id: input.trip_id,
      day_number: input.day_number,
      start_time: input.start_time || null,
      end_time: input.end_time || null,
      title: input.title.trim(),
      location: input.location?.trim() || null,
      category: input.category,
      description: input.description?.trim() || null,
      map_url: input.map_url?.trim() || null,
      sort_order: input.sort_order ?? 0,
      created_by: input.created_by,
    })
    .select('*')
    .single()

  if (error) {
    throw new Error(toReadableError(error, '新增行程失敗'))
  }

  return data as ItineraryItem
}

/** 更新行程項目 */
export async function updateItineraryItem(
  itemId: string,
  input: UpdateItineraryInput,
): Promise<ItineraryItem> {
  const { data, error } = await supabase
    .from('itinerary_items')
    .update({
      day_number: input.day_number,
      start_time: input.start_time || null,
      end_time: input.end_time || null,
      title: input.title.trim(),
      location: input.location?.trim() || null,
      category: input.category,
      description: input.description?.trim() || null,
      map_url: input.map_url?.trim() || null,
      sort_order: input.sort_order ?? 0,
      updated_by: input.updated_by,
    })
    .eq('id', itemId)
    .select('*')
    .single()

  if (error) {
    throw new Error(toReadableError(error, '更新行程失敗'))
  }

  return data as ItineraryItem
}

/** 刪除行程項目 */
export async function deleteItineraryItem(itemId: string): Promise<void> {
  const { error } = await supabase.from('itinerary_items').delete().eq('id', itemId)

  if (error) {
    throw new Error(toReadableError(error, '刪除行程失敗'))
  }
}
