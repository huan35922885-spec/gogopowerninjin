import { supabase } from '@/lib/supabaseClient'
import { toReadableError } from '@/utils/errors'
import type { CreateTripInput, Trip, UpdateTripInput } from '@/types/trip'

function mapTrip(row: Trip): Trip {
  return row
}

/** 取得目前使用者參與的所有旅行（依開始日期排序） */
export async function listMyTrips(): Promise<Trip[]> {
  const { data, error } = await supabase
    .from('trips')
    .select('*')
    .order('start_date', { ascending: true })

  if (error) {
    throw new Error(toReadableError(error, '無法載入旅行列表'))
  }

  return (data ?? []).map(mapTrip)
}

/** 取得單一旅行 */
export async function getTripById(tripId: string): Promise<Trip | null> {
  const { data, error } = await supabase
    .from('trips')
    .select('*')
    .eq('id', tripId)
    .maybeSingle()

  if (error) {
    throw new Error(toReadableError(error, '無法載入旅行資料'))
  }

  return data ? mapTrip(data) : null
}

/** 透過 RPC 建立旅行，並自動成為 owner */
export async function createTrip(input: CreateTripInput): Promise<Trip> {
  const { data, error } = await supabase.rpc('create_trip', {
    p_title: input.title,
    p_destination: input.destination ?? null,
    p_description: input.description ?? null,
    p_start_date: input.start_date,
    p_end_date: input.end_date,
    p_cover_image_url: input.cover_image_url ?? null,
  })

  if (error) {
    console.error('[createTrip] Supabase error:', error)
    throw new Error(toReadableError(error, '建立旅行失敗'))
  }

  if (!data) {
    throw new Error('建立旅行失敗，未取得回傳資料。請確認 create_trip RPC 已正確建立。')
  }

  // PostgREST 有時回傳物件，有時是單元素陣列
  const row = Array.isArray(data) ? data[0] : data
  if (!row || typeof row !== 'object' || !('id' in row)) {
    console.error('[createTrip] unexpected payload:', data)
    throw new Error('建立旅行失敗，回傳資料格式不正確')
  }

  return mapTrip(row as Trip)
}

/** 更新旅行基本資訊（RLS：僅 owner） */
export async function updateTrip(tripId: string, input: UpdateTripInput): Promise<Trip> {
  const { data, error } = await supabase
    .from('trips')
    .update({
      title: input.title.trim(),
      destination: input.destination?.trim() || null,
      description: input.description?.trim() || null,
      start_date: input.start_date,
      end_date: input.end_date,
      cover_image_url: input.cover_image_url?.trim() || null,
    })
    .eq('id', tripId)
    .select('*')
    .single()

  if (error) {
    throw new Error(toReadableError(error, '更新旅行失敗'))
  }

  return mapTrip(data)
}

/** 刪除旅行（RLS：僅 owner；相關資料由 FK CASCADE 一併刪除） */
export async function deleteTrip(tripId: string): Promise<void> {
  const { error } = await supabase.from('trips').delete().eq('id', tripId)

  if (error) {
    throw new Error(toReadableError(error, '刪除旅行失敗'))
  }
}
