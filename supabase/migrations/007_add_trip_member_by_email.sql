-- =============================================================================
-- 007_add_trip_member_by_email.sql
-- Owner 可透過已註冊使用者的 Email 邀請成員
-- =============================================================================

CREATE OR REPLACE FUNCTION public.add_trip_member_by_email(
  p_trip_id uuid,
  p_email text,
  p_role text DEFAULT 'viewer'
)
RETURNS public.trip_members
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller uuid := auth.uid();
  v_target_id uuid;
  v_member public.trip_members;
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION '必須登入才能新增成員';
  END IF;

  IF NOT public.is_trip_owner(p_trip_id, v_caller) THEN
    RAISE EXCEPTION '只有 owner 可以新增成員';
  END IF;

  IF p_role IS NULL OR p_role NOT IN ('owner', 'editor', 'viewer') THEN
    RAISE EXCEPTION '角色必須是 owner、editor 或 viewer';
  END IF;

  IF p_email IS NULL OR btrim(p_email) = '' THEN
    RAISE EXCEPTION 'Email 不可為空';
  END IF;

  SELECT u.id INTO v_target_id
  FROM auth.users u
  WHERE lower(u.email) = lower(btrim(p_email))
  LIMIT 1;

  IF v_target_id IS NULL THEN
    RAISE EXCEPTION '找不到此 Email 對應的使用者，請確認對方已完成註冊／登入';
  END IF;

  IF v_target_id = v_caller THEN
    RAISE EXCEPTION '你已經是此旅行的成員';
  END IF;

  -- 確保有 profile（舊帳號可能缺少）
  INSERT INTO public.profiles (id, display_name)
  VALUES (
    v_target_id,
    split_part(btrim(p_email), '@', 1)
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.trip_members (trip_id, user_id, role)
  VALUES (p_trip_id, v_target_id, p_role)
  ON CONFLICT (trip_id, user_id) DO UPDATE
    SET role = EXCLUDED.role
  RETURNING * INTO v_member;

  RETURN v_member;
END;
$$;

REVOKE ALL ON FUNCTION public.add_trip_member_by_email(uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.add_trip_member_by_email(uuid, text, text) TO authenticated;

COMMENT ON FUNCTION public.add_trip_member_by_email IS
  'Owner 以 Email 新增／更新旅行成員。對方必須已是 Auth 使用者。';
