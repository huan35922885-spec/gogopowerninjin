import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim() ?? ''
const supabasePublishableKey =
  (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined)?.trim() ?? ''

/** 檢查環境變數；有問題時回傳中文說明，正常則回傳 null */
export function getSupabaseEnvError(): string | null {
  if (!supabaseUrl) {
    return '缺少環境變數 VITE_SUPABASE_URL：請在專案根目錄的 .env 填入 Supabase 專案 URL。'
  }
  if (!supabasePublishableKey) {
    return '缺少環境變數 VITE_SUPABASE_PUBLISHABLE_KEY：請在 .env 填入 Publishable Key（勿使用 service_role）。'
  }
  return null
}

let client: SupabaseClient | null = null

function getClient(): SupabaseClient {
  const envError = getSupabaseEnvError()
  if (envError) {
    throw new Error(envError)
  }

  if (!client) {
    client = createClient(supabaseUrl, supabasePublishableKey)
  }

  return client
}

/**
 * 全專案唯一的 Supabase Client；請透過 services 層使用，勿在 Vue 元件直接呼叫。
 * 使用 Proxy 延遲建立，避免缺 env 時整頁直接白屏。
 */
export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, property, receiver) {
    const real = getClient()
    const value = Reflect.get(real, property, receiver)
    return typeof value === 'function' ? value.bind(real) : value
  },
})
