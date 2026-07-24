-- =============================================================================
-- 006_verify.sql（可選）
-- 在 SQL Editor 執行，用來快速檢查 migration 是否成功
-- 這支檔案不會修改資料，只做查詢驗證
-- =============================================================================

-- 1) 資料表是否存在
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'profiles',
    'trips',
    'trip_members',
    'itinerary_items',
    'restaurants',
    'checklist_items'
  )
ORDER BY table_name;

-- 2) RLS 是否啟用（rowsecurity = true）
SELECT relname AS table_name, relrowsecurity AS rls_enabled
FROM pg_class
WHERE relnamespace = 'public'::regnamespace
  AND relname IN (
    'profiles',
    'trips',
    'trip_members',
    'itinerary_items',
    'restaurants',
    'checklist_items'
  )
ORDER BY relname;

-- 3) Policy 數量
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 4) Helper / RPC 是否存在
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'is_trip_member',
    'get_trip_role',
    'is_trip_owner',
    'can_edit_trip',
    'create_trip',
    'set_updated_at',
    'handle_new_user',
    'protect_last_trip_owner'
  )
ORDER BY routine_name;
