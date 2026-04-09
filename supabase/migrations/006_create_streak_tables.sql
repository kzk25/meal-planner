CREATE TABLE IF NOT EXISTS streak_log (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  meal_count INTEGER NOT NULL,
  is_counted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS streak_stats (
  id INTEGER PRIMARY KEY DEFAULT 1,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_recorded_date DATE,
  total_recorded_days INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO streak_stats (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

ALTER TABLE streak_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE streak_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "No public access" ON streak_log FOR ALL TO anon, authenticated USING (false);
CREATE POLICY "No public access" ON streak_stats FOR ALL TO anon, authenticated USING (false);
