CREATE TABLE IF NOT EXISTS dishes (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT DEFAULT 'その他',
  dish_type TEXT DEFAULT 'main',
  calories REAL,
  protein REAL,
  fat REAL,
  carbs REAL,
  fiber REAL,
  salt REAL,
  vitamin_a REAL,
  vitamin_b1 REAL,
  vitamin_b2 REAL,
  vitamin_c REAL,
  vitamin_d REAL,
  vitamin_e REAL,
  calcium REAL,
  iron REAL,
  zinc REAL,
  estimated_price_per_serving INTEGER,
  cooking_time_minutes INTEGER,
  is_ai_generated BOOLEAN DEFAULT false,
  is_favorite BOOLEAN DEFAULT false,
  favorited_at TIMESTAMPTZ,
  source_url TEXT,
  source_site TEXT DEFAULT 'manual',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE dishes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "No public access" ON dishes FOR ALL TO anon, authenticated USING (false);

CREATE INDEX idx_dishes_name ON dishes(name);
CREATE INDEX idx_dishes_category ON dishes(category);
CREATE INDEX idx_dishes_is_favorite ON dishes(is_favorite);
