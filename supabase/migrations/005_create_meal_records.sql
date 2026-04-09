CREATE TABLE IF NOT EXISTS meal_records (
  id SERIAL PRIMARY KEY,
  recorded_date DATE NOT NULL,
  meal_type TEXT NOT NULL,
  dish_id INTEGER REFERENCES dishes(id) ON DELETE SET NULL,
  dish_name TEXT,
  servings REAL DEFAULT 1,
  note TEXT,
  source TEXT DEFAULT 'manual',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE meal_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "No public access" ON meal_records FOR ALL TO anon, authenticated USING (false);

CREATE INDEX idx_meal_records_date ON meal_records(recorded_date);
