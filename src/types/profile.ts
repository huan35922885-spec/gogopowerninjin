export interface UserProfile {
  id: string
  display_name: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface UpdateProfileInput {
  display_name: string
  avatar_url?: string | null
}
