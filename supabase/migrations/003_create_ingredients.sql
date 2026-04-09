CREATE TABLE IF NOT EXISTS ingredients (
  id SERIAL PRIMARY KEY,
  dish_id INTEGER REFERENCES dishes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount REAL,
  unit TEXT,
  estimated_price INTEGER
);

ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "No public access" ON ingredients FOR ALL TO anon, authenticated USING (false);

CREATE INDEX idx_ingredients_dish_id ON ingredients(dish_id);
