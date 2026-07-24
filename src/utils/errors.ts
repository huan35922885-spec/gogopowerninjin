/**
 * 將 Supabase / 未知錯誤轉成使用者可讀的中文訊息。
 * 避免在畫面上直接顯示難懂的原始錯誤，但會辨識常見問題。
 */
export function toReadableError(error: unknown, fallback = '操作失敗，請稍後再試'): string {
  if (error == null) {
    return fallback
  }

  const record = typeof error === 'object' && error !== null ? (error as Record<string, unknown>) : null
  const message =
    typeof error === 'string'
      ? error
      : record && 'message' in record
        ? String(record.message)
        : ''
  const code = record && 'code' in record ? String(record.code) : ''
  const details = record && 'details' in record ? String(record.details ?? '') : ''
  const hint = record && 'hint' in record ? String(record.hint ?? '') : ''
  const combined = `${message} ${details} ${hint} ${code}`.toLowerCase()

  if (combined.includes('failed to fetch') || combined.includes('network')) {
    return '無法連線到伺服器，請檢查網路與 VITE_SUPABASE_URL 設定'
  }

  if (
    code === 'PGRST202' ||
    combined.includes('could not find the function') ||
    combined.includes('function public.create_trip') ||
    (combined.includes('create_trip') && combined.includes('not find'))
  ) {
    return '找不到 create_trip 函式。請到 Supabase → SQL Editor，確認已執行 supabase/migrations/004_create_trip_rpc.sql'
  }

  if (code === 'PGRST301' || combined.includes('jwt') || combined.includes('session')) {
    return '登入狀態已失效，請重新登入後再試'
  }

  if (code === '42501' || combined.includes('permission denied')) {
    return '沒有權限執行此操作。請確認已登入，且 SQL migrations（含 GRANT）已執行完成'
  }

  if (combined.includes('rate limit') || combined.includes('too many')) {
    return '請求過於頻繁，請稍後再試'
  }

  if (
    combined.includes('invalid login credentials') ||
    combined.includes('invalid email or password')
  ) {
    return 'Email 或密碼不正確'
  }

  if (
    combined.includes('user already registered') ||
    combined.includes('already been registered')
  ) {
    return '此 Email 已註冊，請直接登入'
  }

  if (combined.includes('password') && combined.includes('at least')) {
    return '密碼至少需要 6 個字元'
  }

  if (combined.includes('signup is disabled')) {
    return '目前無法註冊，請確認 Supabase Email 註冊已開啟'
  }

  if (combined.includes('invalid login') || combined.includes('invalid email')) {
    return 'Email 格式不正確，請重新確認'
  }

  if (combined.includes('email not confirmed')) {
    return '此帳號仍需 Email 驗證。請到 Supabase → Authentication → Providers → Email，關閉 Confirm email'
  }

  if (combined.includes('user not found')) {
    return '找不到此使用者'
  }

  if (combined.includes('foreign key') || code === '23503') {
    return '關聯資料不完整（例如尚未建立 profile）。請確認已執行 001～002 的 SQL，並重新登入一次'
  }

  if (combined.includes('check constraint') || code === '23514') {
    return '資料不符合規則（例如日期或分類）。請檢查表單內容後再試'
  }

  // 後端以中文 RAISE 的業務錯誤可直接顯示
  if (/[\u4e00-\u9fff]/.test(message)) {
    return message
  }

  // 開發時保留部分可辨識訊息，方便排查
  if (message && (message.includes('RPC') || message.includes('schema cache'))) {
    return `${fallback}（${message}）`
  }

  return fallback
}
