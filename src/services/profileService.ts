import { supabase } from '@/lib/supabaseClient'
import { toReadableError } from '@/utils/errors'
import type { UpdateProfileInput, UserProfile } from '@/types/profile'

/** 取得指定使用者的 profile */
export async function getProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    throw new Error(toReadableError(error, '無法載入個人資料'))
  }

  return data as UserProfile | null
}

/** 更新自己的顯示名稱／頭貼網址 */
export async function updateProfile(
  userId: string,
  input: UpdateProfileInput,
): Promise<UserProfile> {
  const { data, error } = await supabase
    .from('profiles')
    .update({
      display_name: input.display_name.trim() || null,
      avatar_url: input.avatar_url?.trim() || null,
    })
    .eq('id', userId)
    .select('*')
    .single()

  if (error) {
    throw new Error(toReadableError(error, '更新個人資料失敗'))
  }

  return data as UserProfile
}

/**
 * 上傳頭貼到 Storage `avatars` bucket。
 * 需先執行 009_avatars_storage.sql。
 */
export async function uploadAvatar(userId: string, file: File): Promise<string> {
  const maxBytes = 2 * 1024 * 1024
  if (file.size > maxBytes) {
    throw new Error('頭貼檔案請小於 2MB')
  }

  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (!allowed.includes(file.type)) {
    throw new Error('頭貼僅支援 JPG、PNG、WebP 或 GIF')
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const path = `${userId}/${Date.now()}.${ext}`

  const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, {
    upsert: true,
    contentType: file.type,
  })

  if (uploadError) {
    throw new Error(
      toReadableError(
        uploadError,
        '上傳頭貼失敗。請確認已執行 009_avatars_storage.sql',
      ),
    )
  }

  const { data } = supabase.storage.from('avatars').getPublicUrl(path)
  return data.publicUrl
}
