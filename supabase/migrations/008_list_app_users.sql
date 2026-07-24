-- =============================================================================
-- 008_list_app_users.sql
-- 讓已登入使用者可列出所有註冊使用者（人數少時方便邀請成員）
-- =============================================================================

CREATE OR REPLACE FUNCTION public.list_app_users()
RETURNS TABLE (
  id uuid,
  display_name text,
  email text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id,
    p.display_name,
    u.email::text
  FROM public.profiles p
  INNER JOIN auth.users u ON u.id = p.id
  ORDER BY u.email ASC;
$$;

REVOKE ALL ON FUNCTION public.list_app_users() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_app_users() TO authenticated;

COMMENT ON FUNCTION public.list_app_users IS
  '列出所有已註冊使用者（id / display_name / email），供邀請成員下拉選單使用。';
