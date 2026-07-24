/**
 * 將 Supabase / 未知錯誤轉成使用者可讀的中文訊息。
 * 避免在畫面上直接顯示原始資料庫錯誤。
 */
export function toReadableError(error: unknown, fallback = '操作失敗，請稍後再試'): string {
  if (error == null) {
    return fallback
  }

  const message =
    typeof error === 'string'
      ? error
      : typeof error === 'object' && 'message' in error
        ? String((error as { message: unknown }).message)
        : ''

  const lower = message.toLowerCase()

  if (lower.includes('failed to fetch') || lower.includes('network')) {
    return '無法連線到伺服器，請檢查網路後再試'
  }

  if (lower.includes('rate limit') || lower.includes('too many')) {
    return '請求過於頻繁，請稍後再試'
  }

  if (lower.includes('invalid login') || lower.includes('invalid email')) {
    return 'Email 格式不正確，請重新確認'
  }

  if (lower.includes('email not confirmed')) {
    return '請先完成 Email 驗證'
  }

  if (lower.includes('user not found')) {
    return '找不到此使用者'
  }

  if (lower.includes('jwt') || lower.includes('session')) {
    return '登入狀態已失效，請重新登入'
  }

  // 後端以中文 RAISE 的業務錯誤可直接顯示
  if (/[\u4e00-\u9fff]/.test(message)) {
    return message
  }

  // 不回傳原始英文錯誤給使用者
  return fallback
}
