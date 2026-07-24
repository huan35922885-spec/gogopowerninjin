-- =============================================================================
-- 001_tables.sql
-- 建立 profiles / trips / trip_members / itinerary_items / restaurants / checklist_items
-- =============================================================================

-- 使用者公開資料：id 對應 auth.users.id
-- 其他表的 user 欄位 FK 到 profiles，而不是直接掛 auth.users：
-- 1) public schema 較好管理與 join（display_name / avatar_url）
-- 2) 透過 profiles 觸發器與 auth.users 同步，權責清楚
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  display_name text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  destination text,
  description text,
  start_date date NOT NULL,
  end_date date NOT NULL,
  cover_image_url text,
  created_by uuid NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT trips_date_range_check CHECK (start_date <= end_date)
);

CREATE TABLE public.trip_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES public.trips (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  role text NOT NULL,
  joined_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT trip_members_role_check CHECK (role IN ('owner', 'editor', 'viewer')),
  CONSTRAINT trip_members_trip_user_unique UNIQUE (trip_id, user_id)
);

CREATE TABLE public.itinerary_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES public.trips (id) ON DELETE CASCADE,
  day_number integer NOT NULL,
  start_time time,
  end_time time,
  title text NOT NULL,
  location text,
  category text NOT NULL,
  description text,
  map_url text,
  sort_order integer NOT NULL DEFAULT 0,
  created_by uuid NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  updated_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT itinerary_day_number_check CHECK (day_number > 0),
  CONSTRAINT itinerary_category_check CHECK (
    category IN ('景點', '早餐', '午餐', '晚餐', '住宿', '交通', '購物', '其他')
  ),
  CONSTRAINT itinerary_time_range_check CHECK (
    start_time IS NULL OR end_time IS NULL OR start_time <= end_time
  )
);

CREATE TABLE public.restaurants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES public.trips (id) ON DELETE CASCADE,
  name text NOT NULL,
  meal_type text,
  address text,
  budget text,
  map_url text,
  status text NOT NULL DEFAULT 'candidate',
  note text,
  created_by uuid NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT restaurants_meal_type_check CHECK (
    meal_type IS NULL
    OR meal_type IN ('早餐', '午餐', '晚餐', '宵夜', '甜點')
  ),
  CONSTRAINT restaurants_status_check CHECK (
    status IN ('candidate', 'selected', 'rejected')
  )
);

CREATE TABLE public.checklist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES public.trips (id) ON DELETE CASCADE,
  content text NOT NULL,
  is_completed boolean NOT NULL DEFAULT false,
  assigned_to uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_by uuid NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_trips_created_by ON public.trips (created_by);
CREATE INDEX idx_trips_start_date ON public.trips (start_date);

CREATE INDEX idx_trip_members_trip_id ON public.trip_members (trip_id);
CREATE INDEX idx_trip_members_user_id ON public.trip_members (user_id);
CREATE INDEX idx_trip_members_trip_role ON public.trip_members (trip_id, role);

CREATE INDEX idx_itinerary_items_trip_id ON public.itinerary_items (trip_id);
CREATE INDEX idx_itinerary_items_trip_day ON public.itinerary_items (trip_id, day_number);
CREATE INDEX idx_itinerary_items_sort ON public.itinerary_items (trip_id, day_number, start_time, sort_order);

CREATE INDEX idx_restaurants_trip_id ON public.restaurants (trip_id);
CREATE INDEX idx_restaurants_status ON public.restaurants (trip_id, status);

CREATE INDEX idx_checklist_items_trip_id ON public.checklist_items (trip_id);
CREATE INDEX idx_checklist_items_assigned_to ON public.checklist_items (assigned_to);
