CREATE TABLE IF NOT EXISTS weekly_scores (
  id SERIAL PRIMARY KEY,
  week_start_date DATE NOT NULL UNIQUE,
  total_score INTEGER,
  calorie_score INTEGER,
  pfc_score INTEGER,
  variety_score INTEGER,
  budget_score INTEGER,
  nutrition_score INTEGER,
  ai_comment TEXT,
  advice_good JSONB,
  advice_improve JSONB,
  advice_suggestion JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE weekly_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "No public access" ON weekly_scores FOR ALL TO anon, authenticated USING (false);
