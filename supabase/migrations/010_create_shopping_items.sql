CREATE TABLE IF NOT EXISTS shopping_items (
  id SERIAL PRIMARY KEY,
  week_start_date DATE NOT NULL,
  ingredient_name TEXT NOT NULL,
  total_amount REAL,
  unit TEXT,
  category TEXT DEFAULT 'その他',
  estimated_price INTEGER,
  actual_price INTEGER,
  is_purchased BOOLEAN DEFAULT false,
  purchased_at TIMESTAMPTZ,
  add_to_fridge BOOLEAN DEFAULT true,
  notion_page_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE shopping_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "No public access" ON shopping_items FOR ALL TO anon, authenticated USING (false);

CREATE INDEX idx_shopping_items_week ON shopping_items(week_start_date);
