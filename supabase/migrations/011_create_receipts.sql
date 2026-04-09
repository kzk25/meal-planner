CREATE TABLE IF NOT EXISTS receipts (
  id SERIAL PRIMARY KEY,
  week_start_date DATE NOT NULL,
  image_path TEXT,
  ocr_result TEXT,
  total_amount INTEGER,
  purchased_at DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "No public access" ON receipts FOR ALL TO anon, authenticated USING (false);
