CREATE TABLE IF NOT EXISTS prepcook_items (
  id SERIAL PRIMARY KEY,
  dish_id INTEGER REFERENCES dishes(id) ON DELETE SET NULL,
  dish_name TEXT,
  cook_date DATE NOT NULL,
  servings INTEGER DEFAULT 1,
  shelf_life_days INTEGER DEFAULT 3,
  assign_meal_type TEXT DEFAULT 'side',
  is_finished BOOLEAN DEFAULT false,
  finished_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE prepcook_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "No public access" ON prepcook_items FOR ALL TO anon, authenticated USING (false);
