-- =============================================================================
-- 003_rls_helpers.sql
-- SECURITY DEFINER helper：避免 RLS policy 互相查詢造成無限遞迴
-- =============================================================================

CREATE OR REPLACE FUNCTION public.is_trip_member(p_trip_id uuid, p_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.trip_members tm
    WHERE tm.trip_id = p_trip_id
      AND tm.user_id = p_user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.get_trip_role(p_trip_id uuid, p_user_id uuid DEFAULT auth.uid())
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tm.role
  FROM public.trip_members tm
  WHERE tm.trip_id = p_trip_id
    AND tm.user_id = p_user_id
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_trip_owner(p_trip_id uuid, p_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.trip_members tm
    WHERE tm.trip_id = p_trip_id
      AND tm.user_id = p_user_id
      AND tm.role = 'owner'
  );
$$;

CREATE OR REPLACE FUNCTION public.can_edit_trip(p_trip_id uuid, p_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.trip_members tm
    WHERE tm.trip_id = p_trip_id
      AND tm.user_id = p_user_id
      AND tm.role IN ('owner', 'editor')
  );
$$;

REVOKE ALL ON FUNCTION public.is_trip_member(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_trip_role(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_trip_owner(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.can_edit_trip(uuid, uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.is_trip_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_trip_role(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_trip_owner(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_edit_trip(uuid, uuid) TO authenticated;

-- anon 也需要在前端未登入時呼叫？第一版旅行僅限成員查看，故不 grant anon
