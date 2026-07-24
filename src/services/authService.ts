import type { Session, User, AuthChangeEvent } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabaseClient'
import { toReadableError } from '@/utils/errors'
import type { AuthCredentials, AuthUser } from '@/types/auth'

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

/** Email + 密碼登入 */
export async function signInWithPassword(credentials: AuthCredentials): Promise<Session> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: credentials.email.trim(),
    password: credentials.password,
  })

  if (error) {
    throw new Error(toReadableError(error, '登入失敗，請確認帳號或密碼'))
  }

  if (!data.session) {
    throw new Error('登入失敗，未取得登入狀態')
  }

  return data.session
}

/**
 * Email + 密碼註冊。
 * 需在 Supabase 關閉「Confirm email」，註冊後才會立刻拿到 session。
 */
export async function signUpWithPassword(credentials: AuthCredentials): Promise<Session> {
  const { data, error } = await supabase.auth.signUp({
    email: credentials.email.trim(),
    password: credentials.password,
  })

  if (error) {
    throw new Error(toReadableError(error, '註冊失敗，請稍後再試'))
  }

  if (!data.session) {
    throw new Error(
      '註冊成功，但尚未啟用即時登入。請到 Supabase → Authentication → Providers → Email，關閉 Confirm email 後再試。',
    )
  }

  return data.session
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
