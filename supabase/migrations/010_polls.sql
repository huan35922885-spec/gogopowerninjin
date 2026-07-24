-- =============================================================================
-- 010_polls.sql
-- 旅行投票：polls / poll_options / poll_votes + RLS + create/close/vote RPC
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

CREATE TABLE public.polls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES public.trips (id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'open',
  created_by uuid NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  closed_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  closed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT polls_title_not_blank CHECK (char_length(trim(title)) > 0),
  CONSTRAINT polls_status_check CHECK (status IN ('open', 'closed'))
);

CREATE TABLE public.poll_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id uuid NOT NULL REFERENCES public.polls (id) ON DELETE CASCADE,
  label text NOT NULL,
  restaurant_id uuid REFERENCES public.restaurants (id) ON DELETE SET NULL,
  itinerary_item_id uuid REFERENCES public.itinerary_items (id) ON DELETE SET NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT poll_options_label_not_blank CHECK (char_length(trim(label)) > 0)
);

CREATE TABLE public.poll_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id uuid NOT NULL REFERENCES public.polls (id) ON DELETE CASCADE,
  option_id uuid NOT NULL REFERENCES public.poll_options (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT poll_votes_unique_user UNIQUE (poll_id, user_id)
);

CREATE INDEX idx_polls_trip_id ON public.polls (trip_id);
CREATE INDEX idx_polls_trip_status ON public.polls (trip_id, status);
CREATE INDEX idx_poll_options_poll_id ON public.poll_options (poll_id);
CREATE INDEX idx_poll_votes_poll_id ON public.poll_votes (poll_id);
CREATE INDEX idx_poll_votes_option_id ON public.poll_votes (option_id);

CREATE TRIGGER trg_polls_set_updated_at
BEFORE UPDATE ON public.polls
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_poll_votes_set_updated_at
BEFORE UPDATE ON public.poll_votes
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;

-- polls：成員可讀；owner/editor 可新增／更新／刪除
CREATE POLICY polls_select_member
ON public.polls
FOR SELECT
TO authenticated
USING (public.is_trip_member(trip_id));

CREATE POLICY polls_insert_editor
ON public.polls
FOR INSERT
TO authenticated
WITH CHECK (
  public.can_edit_trip(trip_id)
  AND created_by = auth.uid()
);

CREATE POLICY polls_update_editor
ON public.polls
FOR UPDATE
TO authenticated
USING (public.can_edit_trip(trip_id))
WITH CHECK (public.can_edit_trip(trip_id));

CREATE POLICY polls_delete_editor
ON public.polls
FOR DELETE
TO authenticated
USING (public.can_edit_trip(trip_id));

-- poll_options：透過 poll 的 trip 判斷
CREATE POLICY poll_options_select_member
ON public.poll_options
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.polls p
    WHERE p.id = poll_id AND public.is_trip_member(p.trip_id)
  )
);

CREATE POLICY poll_options_insert_editor
ON public.poll_options
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.polls p
    WHERE p.id = poll_id AND public.can_edit_trip(p.trip_id)
  )
);

CREATE POLICY poll_options_delete_editor
ON public.poll_options
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.polls p
    WHERE p.id = poll_id AND public.can_edit_trip(p.trip_id)
  )
);

-- poll_votes：成員可讀；成員可對進行中投票投下／改投自己的票
CREATE POLICY poll_votes_select_member
ON public.poll_votes
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.polls p
    WHERE p.id = poll_id AND public.is_trip_member(p.trip_id)
  )
);

CREATE POLICY poll_votes_insert_member
ON public.poll_votes
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.polls p
    WHERE p.id = poll_id
      AND p.status = 'open'
      AND public.is_trip_member(p.trip_id)
  )
  AND EXISTS (
    SELECT 1 FROM public.poll_options o
    WHERE o.id = option_id AND o.poll_id = poll_id
  )
);

CREATE POLICY poll_votes_update_member
ON public.poll_votes
FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.polls p
    WHERE p.id = poll_id
      AND p.status = 'open'
      AND public.is_trip_member(p.trip_id)
  )
)
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.polls p
    WHERE p.id = poll_id
      AND p.status = 'open'
      AND public.is_trip_member(p.trip_id)
  )
  AND EXISTS (
    SELECT 1 FROM public.poll_options o
    WHERE o.id = option_id AND o.poll_id = poll_id
  )
);

CREATE POLICY poll_votes_delete_member
ON public.poll_votes
FOR DELETE
TO authenticated
USING (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.polls p
    WHERE p.id = poll_id
      AND p.status = 'open'
      AND public.is_trip_member(p.trip_id)
  )
);

-- ---------------------------------------------------------------------------
-- RPC：建立投票（含選項）
-- p_options: [{"label":"...","restaurant_id":null,"itinerary_item_id":null}, ...]
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.create_poll(
  p_trip_id uuid,
  p_title text,
  p_description text DEFAULT NULL,
  p_options jsonb DEFAULT '[]'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_poll_id uuid;
  v_option jsonb;
  v_idx integer := 0;
  v_label text;
  v_restaurant_id uuid;
  v_itinerary_item_id uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  IF NOT public.can_edit_trip(p_trip_id) THEN
    RAISE EXCEPTION 'permission denied';
  END IF;

  IF p_title IS NULL OR char_length(trim(p_title)) = 0 THEN
    RAISE EXCEPTION 'title required';
  END IF;

  IF jsonb_typeof(p_options) <> 'array' OR jsonb_array_length(p_options) < 2 THEN
    RAISE EXCEPTION 'at least 2 options required';
  END IF;

  INSERT INTO public.polls (trip_id, title, description, created_by)
  VALUES (p_trip_id, trim(p_title), NULLIF(trim(p_description), ''), v_user_id)
  RETURNING id INTO v_poll_id;

  FOR v_option IN SELECT * FROM jsonb_array_elements(p_options)
  LOOP
    v_label := trim(COALESCE(v_option->>'label', ''));
    IF char_length(v_label) = 0 THEN
      RAISE EXCEPTION 'option label required';
    END IF;

    v_restaurant_id := NULLIF(v_option->>'restaurant_id', '')::uuid;
    v_itinerary_item_id := NULLIF(v_option->>'itinerary_item_id', '')::uuid;

    -- 若綁定餐廳／行程，必須屬於同一趟旅行
    IF v_restaurant_id IS NOT NULL THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.restaurants r
        WHERE r.id = v_restaurant_id AND r.trip_id = p_trip_id
      ) THEN
        RAISE EXCEPTION 'invalid restaurant option';
      END IF;
    END IF;

    IF v_itinerary_item_id IS NOT NULL THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.itinerary_items i
        WHERE i.id = v_itinerary_item_id AND i.trip_id = p_trip_id
      ) THEN
        RAISE EXCEPTION 'invalid itinerary option';
      END IF;
    END IF;

    INSERT INTO public.poll_options (
      poll_id, label, restaurant_id, itinerary_item_id, sort_order
    ) VALUES (
      v_poll_id, v_label, v_restaurant_id, v_itinerary_item_id, v_idx
    );

    v_idx := v_idx + 1;
  END LOOP;

  RETURN v_poll_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_poll(uuid, text, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_poll(uuid, text, text, jsonb) TO authenticated;

-- ---------------------------------------------------------------------------
-- RPC：投下／改投（每人一票）
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.cast_poll_vote(
  p_poll_id uuid,
  p_option_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_trip_id uuid;
  v_status text;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  SELECT trip_id, status INTO v_trip_id, v_status
  FROM public.polls
  WHERE id = p_poll_id;

  IF v_trip_id IS NULL THEN
    RAISE EXCEPTION 'poll not found';
  END IF;

  IF NOT public.is_trip_member(v_trip_id) THEN
    RAISE EXCEPTION 'permission denied';
  END IF;

  IF v_status <> 'open' THEN
    RAISE EXCEPTION 'poll is closed';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.poll_options o
    WHERE o.id = p_option_id AND o.poll_id = p_poll_id
  ) THEN
    RAISE EXCEPTION 'invalid option';
  END IF;

  INSERT INTO public.poll_votes (poll_id, option_id, user_id)
  VALUES (p_poll_id, p_option_id, v_user_id)
  ON CONFLICT (poll_id, user_id)
  DO UPDATE SET
    option_id = EXCLUDED.option_id,
    updated_at = now();
END;
$$;

REVOKE ALL ON FUNCTION public.cast_poll_vote(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cast_poll_vote(uuid, uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- RPC：結束投票
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.close_poll(p_poll_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_trip_id uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  SELECT trip_id INTO v_trip_id FROM public.polls WHERE id = p_poll_id;

  IF v_trip_id IS NULL THEN
    RAISE EXCEPTION 'poll not found';
  END IF;

  IF NOT public.can_edit_trip(v_trip_id) THEN
    RAISE EXCEPTION 'permission denied';
  END IF;

  UPDATE public.polls
  SET
    status = 'closed',
    closed_by = v_user_id,
    closed_at = now()
  WHERE id = p_poll_id
    AND status = 'open';
END;
$$;

REVOKE ALL ON FUNCTION public.close_poll(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.close_poll(uuid) TO authenticated;
