/**
 * ベリーヨーグルトオートミールをデフォルト朝食として登録し、
 * 今週の朝食をすべて差し替える
 */
import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const WEEK = "2026-04-05";
const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

const DISH = {
  name: "ベリーヨーグルトオートミール",
  category: "洋食",
  dish_type: "main",
  calories: 210,
  protein: 8,
  fat: 4,
  carbs: 34,
  fiber: 5,
  salt: 0.1,
  estimated_price_per_serving: 120,
  cooking_time_minutes: 3,
  is_ai_generated: false,
};

const INGREDIENTS = [
  { name: "オートミール",          amount: 40,  unit: "g",  estimated_price: 40 },
  { name: "プレーンヨーグルト",    amount: 100, unit: "g",  estimated_price: 50 },
  { name: "冷凍ミックスベリー",    amount: 20,  unit: "g",  estimated_price: 30 },
];

async function main() {
  console.log("=== デフォルト朝食を設定します ===\n");

  // 1. Upsert dish
  const { data: dish, error: dishErr } = await supabase
    .from("dishes")
    .upsert(DISH, { onConflict: "name", ignoreDuplicates: false })
    .select()
    .single();

  if (dishErr || !dish) {
    console.error("料理の登録に失敗:", dishErr?.message);
    process.exit(1);
  }
  console.log(`✓ 料理を登録 (id=${dish.id}): ${dish.name}`);

  // 2. Refresh ingredients
  await supabase.from("ingredients").delete().eq("dish_id", dish.id);
  const { error: ingErr } = await supabase.from("ingredients").insert(
    INGREDIENTS.map((ing) => ({ ...ing, dish_id: dish.id }))
  );
  if (ingErr) console.warn("食材の登録でエラー:", ingErr.message);
  else console.log(`✓ 食材 ${INGREDIENTS.length}品を登録`);

  // 3. Upsert breakfast for all 7 days this week
  for (const day of DAYS) {
    const { error } = await supabase.from("meal_plans").upsert(
      {
        week_start_date: WEEK,
        day_of_week: day,
        meal_type: "breakfast",
        dish_id: dish.id,
        servings: 1,
      },
      { onConflict: "week_start_date,day_of_week,meal_type" }
    );
    if (error) console.error(`  ${day} 朝食の更新失敗:`, error.message);
    else console.log(`  ✓ ${day} 朝食 → ${dish.name}`);
  }

  console.log("\n✅ 完了しました！ /meal-plan で確認してください。");
}

main().catch(console.error);
