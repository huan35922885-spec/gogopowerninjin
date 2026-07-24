-- =============================================================================
-- 004_create_trip_rpc.sql
-- 以單一 transaction 建立旅行，並把建立者設為 owner
-- =============================================================================

CREATE OR REPLACE FUNCTION public.create_trip(
  p_title text,
  p_destination text DEFAULT NULL,
  p_description text DEFAULT NULL,
  p_start_date date DEFAULT NULL,
  p_end_date date DEFAULT NULL,
  p_cover_image_url text DEFAULT NULL
)
RETURNS public.trips
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_trip public.trips;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION '必須登入才能建立旅行';
  END IF;

  IF p_title IS NULL OR btrim(p_title) = '' THEN
    RAISE EXCEPTION '旅行名稱不可為空';
  END IF;

  IF p_start_date IS NULL OR p_end_date IS NULL THEN
    RAISE EXCEPTION '開始與結束日期為必填';
  END IF;

  IF p_start_date > p_end_date THEN
    RAISE EXCEPTION '開始日期不得晚於結束日期';
  END IF;

  -- 確保 profile 存在（Magic Link 首次登入理論上已由 trigger 建立）
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_user_id) THEN
    INSERT INTO public.profiles (id, display_name)
    VALUES (v_user_id, 'Traveler');
  END IF;

  INSERT INTO public.trips (
    title,
    destination,
    description,
    start_date,
    end_date,
    cover_image_url,
    created_by
  )
  VALUES (
    btrim(p_title),
    NULLIF(btrim(COALESCE(p_destination, '')), ''),
    NULLIF(btrim(COALESCE(p_description, '')), ''),
    p_start_date,
    p_end_date,
    NULLIF(btrim(COALESCE(p_cover_image_url, '')), ''),
    v_user_id
  )
  RETURNING * INTO v_trip;

  INSERT INTO public.trip_members (trip_id, user_id, role)
  VALUES (v_trip.id, v_user_id, 'owner');

  RETURN v_trip;
END;
$$;

REVOKE ALL ON FUNCTION public.create_trip(text, text, text, date, date, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_trip(text, text, text, date, date, text) TO authenticated;

COMMENT ON FUNCTION public.create_trip IS
  '建立旅行並在同一交易中將呼叫者設為 owner。前端請用 supabase.rpc(''create_trip'', {...})。';
