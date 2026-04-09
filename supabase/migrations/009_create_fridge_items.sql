CREATE TABLE IF NOT EXISTS fridge_items (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  amount REAL,
  unit TEXT,
  category TEXT DEFAULT 'その他',
  expiry_date DATE,
  is_finished BOOLEAN DEFAULT false,
  added_from TEXT DEFAULT 'manual',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE fridge_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "No public access" ON fridge_items FOR ALL TO anon, authenticated USING (false);
