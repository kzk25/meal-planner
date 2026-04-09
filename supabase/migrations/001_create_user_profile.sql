CREATE TABLE IF NOT EXISTS user_profile (
  id SERIAL PRIMARY KEY,
  gender TEXT,
  age INTEGER,
  height_cm REAL,
  weight_kg REAL,
  activity_level TEXT DEFAULT 'medium',
  goal TEXT DEFAULT 'maintain',
  meal_budget_per_meal INTEGER DEFAULT 500,
  meal_budget_per_day INTEGER DEFAULT 1500,
  default_servings INTEGER DEFAULT 1,
  preferred_categories JSONB DEFAULT '["和食","洋食","中華"]',
  allergies TEXT,
  include_side_dish BOOLEAN DEFAULT true,
  include_soup BOOLEAN DEFAULT true,
  claude_api_key TEXT,
  notion_api_key TEXT,
  notion_database_id TEXT,
  rice_purchase_kg REAL,
  rice_daily_consumption_go REAL DEFAULT 2,
  rice_last_purchased_at DATE,
  rice_notify_days_before INTEGER DEFAULT 3,
  push_subscription TEXT,
  streak_min_meals_per_day INTEGER DEFAULT 1,
  week_start_day TEXT DEFAULT 'monday',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_profile ENABLE ROW LEVEL SECURITY;
CREATE POLICY "No public access" ON user_profile FOR ALL TO anon, authenticated USING (false);

-- Insert default profile
INSERT INTO user_profile (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
