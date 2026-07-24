-- =============================================================================
-- 005_rls_policies.sql
-- 啟用 RLS 並建立 policies（第一版：僅旅行成員可查看，不做公開旅行）
-- =============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itinerary_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_items ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------

-- 已登入者可查看所有 profile（成員列表需要顯示名稱／頭像）
CREATE POLICY profiles_select_authenticated
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- 只能修改自己的 profile
CREATE POLICY profiles_update_own
ON public.profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- INSERT 由 handle_new_user trigger（SECURITY DEFINER）處理，一般使用者不直接 insert

-- ---------------------------------------------------------------------------
-- trips
-- 第一版：不做公開欄位，僅成員可查看
-- 建立旅行請走 create_trip RPC（SECURITY DEFINER），不開放直接 INSERT
-- ---------------------------------------------------------------------------

CREATE POLICY trips_select_member
ON public.trips
FOR SELECT
TO authenticated
USING (public.is_trip_member(id));

CREATE POLICY trips_update_owner
ON public.trips
FOR UPDATE
TO authenticated
USING (public.is_trip_owner(id))
WITH CHECK (public.is_trip_owner(id));

CREATE POLICY trips_delete_owner
ON public.trips
FOR DELETE
TO authenticated
USING (public.is_trip_owner(id));

-- ---------------------------------------------------------------------------
-- trip_members
-- ---------------------------------------------------------------------------

CREATE POLICY trip_members_select_member
ON public.trip_members
FOR SELECT
TO authenticated
USING (public.is_trip_member(trip_id));

CREATE POLICY trip_members_insert_owner
ON public.trip_members
FOR INSERT
TO authenticated
WITH CHECK (public.is_trip_owner(trip_id));

CREATE POLICY trip_members_update_owner
ON public.trip_members
FOR UPDATE
TO authenticated
USING (public.is_trip_owner(trip_id))
WITH CHECK (public.is_trip_owner(trip_id));

-- owner 可移除成員，但不可移除自己（最後一位 owner 另由 trigger 保護）
CREATE POLICY trip_members_delete_owner
ON public.trip_members
FOR DELETE
TO authenticated
USING (
  public.is_trip_owner(trip_id)
  AND user_id <> auth.uid()
);

-- ---------------------------------------------------------------------------
-- itinerary_items
-- ---------------------------------------------------------------------------

CREATE POLICY itinerary_select_member
ON public.itinerary_items
FOR SELECT
TO authenticated
USING (public.is_trip_member(trip_id));

CREATE POLICY itinerary_insert_editor
ON public.itinerary_items
FOR INSERT
TO authenticated
WITH CHECK (
  public.can_edit_trip(trip_id)
  AND created_by = auth.uid()
);

CREATE POLICY itinerary_update_editor
ON public.itinerary_items
FOR UPDATE
TO authenticated
USING (public.can_edit_trip(trip_id))
WITH CHECK (public.can_edit_trip(trip_id));

CREATE POLICY itinerary_delete_editor
ON public.itinerary_items
FOR DELETE
TO authenticated
USING (public.can_edit_trip(trip_id));

-- ---------------------------------------------------------------------------
-- restaurants
-- ---------------------------------------------------------------------------

CREATE POLICY restaurants_select_member
ON public.restaurants
FOR SELECT
TO authenticated
USING (public.is_trip_member(trip_id));

CREATE POLICY restaurants_insert_editor
ON public.restaurants
FOR INSERT
TO authenticated
WITH CHECK (
  public.can_edit_trip(trip_id)
  AND created_by = auth.uid()
);

CREATE POLICY restaurants_update_editor
ON public.restaurants
FOR UPDATE
TO authenticated
USING (public.can_edit_trip(trip_id))
WITH CHECK (public.can_edit_trip(trip_id));

CREATE POLICY restaurants_delete_editor
ON public.restaurants
FOR DELETE
TO authenticated
USING (public.can_edit_trip(trip_id));

-- ---------------------------------------------------------------------------
-- checklist_items
-- ---------------------------------------------------------------------------

CREATE POLICY checklist_select_member
ON public.checklist_items
FOR SELECT
TO authenticated
USING (public.is_trip_member(trip_id));

CREATE POLICY checklist_insert_editor
ON public.checklist_items
FOR INSERT
TO authenticated
WITH CHECK (
  public.can_edit_trip(trip_id)
  AND created_by = auth.uid()
);

CREATE POLICY checklist_update_editor
ON public.checklist_items
FOR UPDATE
TO authenticated
USING (public.can_edit_trip(trip_id))
WITH CHECK (public.can_edit_trip(trip_id));

CREATE POLICY checklist_delete_editor
ON public.checklist_items
FOR DELETE
TO authenticated
USING (public.can_edit_trip(trip_id));
