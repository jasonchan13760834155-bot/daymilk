-- Presets: one per user
CREATE TABLE public.presets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  start_time TIME NOT NULL DEFAULT '06:00',
  end_time TIME NOT NULL DEFAULT '22:00',
  daily_count INT NOT NULL DEFAULT 5 CHECK (daily_count >= 1 AND daily_count <= 12),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Daily plans: one row per planned session
CREATE TABLE public.daily_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  planned_time TIME NOT NULL,
  actual_time TIMESTAMPTZ,
  sort_order INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_daily_plans_user_date ON public.daily_plans(user_id, date);

-- RLS
ALTER TABLE public.presets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own presets" ON public.presets
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own plans" ON public.daily_plans
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Enable realtime for daily_plans (optional)
ALTER PUBLICATION supabase_realtime ADD TABLE public.daily_plans;
