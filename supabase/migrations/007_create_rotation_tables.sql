CREATE TABLE IF NOT EXISTS meal_rotations (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  memo TEXT,
  weekly_calories REAL,
  weekly_estimated_price INTEGER,
  last_used_at DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS meal_rotation_items (
  id SERIAL PRIMARY KEY,
  rotation_id INTEGER REFERENCES meal_rotations(id) ON DELETE CASCADE,
  day_of_week TEXT NOT NULL,
  meal_type TEXT NOT NULL,
  dish_id INTEGER REFERENCES dishes(id) ON DELETE SET NULL,
  servings INTEGER DEFAULT 1
);

ALTER TABLE meal_rotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_rotation_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "No public access" ON meal_rotations FOR ALL TO anon, authenticated USING (false);
CREATE POLICY "No public access" ON meal_rotation_items FOR ALL TO anon, authenticated USING (false);
