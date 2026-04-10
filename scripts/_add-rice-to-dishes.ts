/**
 * 昼食・夕食で使われる全料理に白米 180g を追加し、栄養値を更新する
 * ただし既に「ご飯」「白米」「ライス」を含む食材がある料理はスキップ
 */
import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 白米 180g (炊飯後) の栄養値
const RICE = {
  name: "白米",
  amount: 180,
  unit: "g",
  estimated_price: 36,
  calories: 234,
  protein: 3.6,
  fat: 0.5,
  carbs: 51.1,
  fiber: 0.5,
  salt: 0,
};

// 米系食材名の判定（部分一致・大文字小文字無視）
function hasRice(ingredientNames: string[]): boolean {
  const riceKeywords = ["ご飯", "白米", "ライス"];
  return ingredientNames.some((name) =>
    riceKeywords.some((kw) => name.toLowerCase().includes(kw.toLowerCase()))
  );
}

async function main() {
  console.log("=== 白米 180g を昼食・夕食の料理に追加します ===\n");

  // 全料理を取得
  const { data: dishes, error: dishError } = await supabase
    .from("dishes")
    .select("id, name, calories, protein, fat, carbs, fiber, estimated_price_per_serving");

  if (dishError || !dishes) {
    console.error("料理の取得に失敗:", dishError?.message);
    process.exit(1);
  }

  console.log(`取得した料理数: ${dishes.length}`);

  // 各料理の食材を取得
  const { data: allIngredients, error: ingError } = await supabase
    .from("ingredients")
    .select("dish_id, name");

  if (ingError || !allIngredients) {
    console.error("食材の取得に失敗:", ingError?.message);
    process.exit(1);
  }

  // dish_id → 食材名一覧 のマップを作成
  const ingredientMap = new Map<number, string[]>();
  for (const ing of allIngredients) {
    if (!ingredientMap.has(ing.dish_id)) {
      ingredientMap.set(ing.dish_id, []);
    }
    ingredientMap.get(ing.dish_id)!.push(ing.name);
  }

  const updated: string[] = [];
  const skipped: string[] = [];

  for (const dish of dishes) {
    const ingredientNames = ingredientMap.get(dish.id) ?? [];

    if (hasRice(ingredientNames)) {
      skipped.push(`${dish.name} (id=${dish.id})`);
      continue;
    }

    // 食材に白米を追加
    const { error: insertError } = await supabase.from("ingredients").insert({
      dish_id: dish.id,
      name: RICE.name,
      amount: RICE.amount,
      unit: RICE.unit,
      estimated_price: RICE.estimated_price,
    });

    if (insertError) {
      console.error(`  [ERROR] ${dish.name} への白米追加失敗:`, insertError.message);
      continue;
    }

    // 栄養値を更新
    const { error: updateError } = await supabase
      .from("dishes")
      .update({
        calories: (dish.calories ?? 0) + RICE.calories,
        protein: parseFloat(((dish.protein ?? 0) + RICE.protein).toFixed(1)),
        fat: parseFloat(((dish.fat ?? 0) + RICE.fat).toFixed(1)),
        carbs: parseFloat(((dish.carbs ?? 0) + RICE.carbs).toFixed(1)),
        fiber: parseFloat(((dish.fiber ?? 0) + RICE.fiber).toFixed(1)),
        estimated_price_per_serving:
          (dish.estimated_price_per_serving ?? 0) + RICE.estimated_price,
      })
      .eq("id", dish.id);

    if (updateError) {
      console.error(`  [ERROR] ${dish.name} の栄養値更新失敗:`, updateError.message);
      continue;
    }

    updated.push(`${dish.name} (id=${dish.id})`);
    console.log(`  ✓ 更新: ${dish.name}`);
  }

  console.log("\n--- 結果 ---");
  console.log(`\n[更新済み] ${updated.length} 件:`);
  updated.forEach((d) => console.log(`  - ${d}`));

  console.log(`\n[スキップ（既に米あり）] ${skipped.length} 件:`);
  skipped.forEach((d) => console.log(`  - ${d}`));

  console.log("\n✅ 完了しました！");
}

main().catch(console.error);
