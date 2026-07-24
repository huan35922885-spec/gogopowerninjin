/** 旅行成員角色 */
export type TripRole = 'owner' | 'editor' | 'viewer'

export interface Trip {
  id: string
  title: string
  destination: string | null
  description: string | null
  start_date: string
  end_date: string
  cover_image_url: string | null
  created_by: string
  created_at: string
  updated_at: string
}

export interface TripMember {
  id: string
  trip_id: string
  user_id: string
  role: TripRole
  joined_at: string
}

export interface TripMemberWithProfile extends TripMember {
  profile: {
    display_name: string | null
    avatar_url: string | null
  } | null
}

/** 可供邀請的 App 使用者 */
export interface AppUser {
  id: string
  display_name: string | null
  email: string | null
}

export interface TripFormValues {
  title: string
  destination: string
  description: string
  start_date: string
  end_date: string
  cover_image_url: string
}

export interface CreateTripInput {
  title: string
  destination?: string | null
  description?: string | null
  start_date: string
  end_date: string
  cover_image_url?: string | null
}

export type UpdateTripInput = CreateTripInput

export const TRIP_ROLE_LABELS: Record<TripRole, string> = {
  owner: '擁有者',
  editor: '編輯者',
  viewer: '唯讀',
}
