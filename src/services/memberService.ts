import { supabase } from '@/lib/supabaseClient'
import { toReadableError } from '@/utils/errors'
import type { TripMemberWithProfile, TripRole } from '@/types/trip'

/**
 * 取得目前使用者在指定旅行的角色。
 * 使用 DB helper get_trip_role，避免 RLS 遞迴問題。
 */
export async function getMyTripRole(tripId: string): Promise<TripRole | null> {
  const { data, error } = await supabase.rpc('get_trip_role', {
    p_trip_id: tripId,
  })

  if (error) {
    throw new Error(toReadableError(error, '無法確認旅行權限'))
  }

  if (data == null || data === '') {
    return null
  }

  if (data === 'owner' || data === 'editor' || data === 'viewer') {
    return data
  }

  return null
}

/** 列出旅行成員（含 profile 顯示名稱） */
export async function listTripMembers(tripId: string): Promise<TripMemberWithProfile[]> {
  const { data, error } = await supabase
    .from('trip_members')
    .select(
      `
      id,
      trip_id,
      user_id,
      role,
      joined_at,
      profiles:user_id (
        display_name,
        avatar_url
      )
    `,
    )
    .eq('trip_id', tripId)
    .order('joined_at', { ascending: true })

  if (error) {
    throw new Error(toReadableError(error, '無法載入成員列表'))
  }

  return (data ?? []).map((row) => {
    const profileRaw = row.profiles
    const profile = Array.isArray(profileRaw) ? (profileRaw[0] ?? null) : profileRaw

    return {
      id: row.id as string,
      trip_id: row.trip_id as string,
      user_id: row.user_id as string,
      role: row.role as TripRole,
      joined_at: row.joined_at as string,
      profile: profile
        ? {
            display_name: (profile as { display_name: string | null }).display_name,
            avatar_url: (profile as { avatar_url: string | null }).avatar_url,
          }
        : null,
    }
  })
}

/** 以 Email 新增成員（需先執行 007 SQL migration） */
export async function addMemberByEmail(
  tripId: string,
  email: string,
  role: TripRole,
): Promise<void> {
  const { error } = await supabase.rpc('add_trip_member_by_email', {
    p_trip_id: tripId,
    p_email: email.trim(),
    p_role: role,
  })

  if (error) {
    throw new Error(toReadableError(error, '新增成員失敗'))
  }
}

/** 更新成員角色（RLS：僅 owner） */
export async function updateMemberRole(memberId: string, role: TripRole): Promise<void> {
  const { error } = await supabase
    .from('trip_members')
    .update({ role })
    .eq('id', memberId)

  if (error) {
    throw new Error(toReadableError(error, '更新成員角色失敗'))
  }
}

/** 移除成員（RLS：不可移除自己；trigger 保護最後一位 owner） */
export async function removeMember(memberId: string): Promise<void> {
  const { error } = await supabase.from('trip_members').delete().eq('id', memberId)

  if (error) {
    throw new Error(toReadableError(error, '移除成員失敗'))
  }
}
