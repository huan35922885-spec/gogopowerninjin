import type { Session, User, AuthChangeEvent } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabaseClient'
import { toReadableError } from '@/utils/errors'
import type { AuthUser } from '@/types/auth'

function toAuthUser(user: User | null): AuthUser | null {
  if (!user) {
    return null
  }

  return {
    id: user.id,
    email: user.email ?? null,
  }
}

/** 取得目前 session（重新整理後恢復登入狀態用） */
export async function getSession(): Promise<Session | null> {
  const { data, error } = await supabase.auth.getSession()

  if (error) {
    throw new Error(toReadableError(error, '無法取得登入狀態'))
  }

  return data.session
}

/** 將目前使用者轉成應用程式用的 AuthUser */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const { data, error } = await supabase.auth.getUser()

  if (error) {
    // 未登入時 getUser 可能回錯誤，視為未登入
    return null
  }

  return toAuthUser(data.user)
}

/**
 * 發送 Magic Link 到指定 Email。
 * redirectTo 必須在 Supabase Dashboard → Authentication → URL Configuration 允許清單內。
 */
export async function sendMagicLink(email: string): Promise<void> {
  const redirectTo = `${window.location.origin}/trips`

  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim(),
    options: {
      emailRedirectTo: redirectTo,
      shouldCreateUser: true,
    },
  })

  if (error) {
    throw new Error(toReadableError(error, '無法發送登入連結，請稍後再試'))
  }
}

/** 登出並清除本機 session */
export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut()

  if (error) {
    throw new Error(toReadableError(error, '登出失敗，請稍後再試'))
  }
}

/** 訂閱登入狀態變化（登入、登出、token 刷新） */
export function onAuthStateChange(
  callback: (event: AuthChangeEvent, session: Session | null) => void,
): () => void {
  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session)
  })

  return () => {
    data.subscription.unsubscribe()
  }
}

export function mapSessionUser(session: Session | null): AuthUser | null {
  return toAuthUser(session?.user ?? null)
}
