-- =============================================================================
-- 002_triggers.sql
-- updated_at 自動更新、註冊時建立 profile、保護最後一位 owner
-- =============================================================================

-- 通用：更新 updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_profiles_set_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_trips_set_updated_at
BEFORE UPDATE ON public.trips
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_itinerary_items_set_updated_at
BEFORE UPDATE ON public.itinerary_items
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_restaurants_set_updated_at
BEFORE UPDATE ON public.restaurants
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_checklist_items_set_updated_at
BEFORE UPDATE ON public.checklist_items
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- 新使用者註冊後自動建立 profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data ->> 'avatar_url'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- 禁止移除／降級旅行的最後一位 owner
CREATE OR REPLACE FUNCTION public.protect_last_trip_owner()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  remaining_owners integer;
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.role = 'owner' THEN
      SELECT count(*) INTO remaining_owners
      FROM public.trip_members
      WHERE trip_id = OLD.trip_id
        AND role = 'owner'
        AND id <> OLD.id;

      IF remaining_owners = 0 THEN
        RAISE EXCEPTION '每趟旅行至少需要一位 owner，無法移除最後一位 owner';
      END IF;
    END IF;
    RETURN OLD;
  END IF;

  -- UPDATE：從 owner 改成其他角色
  IF TG_OP = 'UPDATE'
     AND OLD.role = 'owner'
     AND NEW.role IS DISTINCT FROM 'owner' THEN
    SELECT count(*) INTO remaining_owners
    FROM public.trip_members
    WHERE trip_id = OLD.trip_id
      AND role = 'owner'
      AND id <> OLD.id;

    IF remaining_owners = 0 THEN
      RAISE EXCEPTION '每趟旅行至少需要一位 owner，無法降級最後一位 owner';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_protect_last_trip_owner
BEFORE UPDATE OR DELETE ON public.trip_members
FOR EACH ROW
EXECUTE FUNCTION public.protect_last_trip_owner();
