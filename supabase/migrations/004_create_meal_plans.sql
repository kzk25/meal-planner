CREATE TABLE IF NOT EXISTS meal_plans (
  id SERIAL PRIMARY KEY,
  week_start_date DATE NOT NULL,
  day_of_week TEXT NOT NULL,
  meal_type TEXT NOT NULL,
  dish_id INTEGER REFERENCES dishes(id) ON DELETE SET NULL,
  servings INTEGER DEFAULT 1,
  is_prepcook BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "No public access" ON meal_plans FOR ALL TO anon, authenticated USING (false);

CREATE INDEX idx_meal_plans_week ON meal_plans(week_start_date);
CREATE UNIQUE INDEX idx_meal_plans_unique ON meal_plans(week_start_date, day_of_week, meal_type);
