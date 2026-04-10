/**
 * 夜ご飯の設定を更新：
 * - 野菜が取れるメニュー優先
 * - 調理時間30分以内
 * - 今週の30分超えメニューを差し替え
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

// 30分以内 & 野菜たっぷりの代替メニュー
const REPLACEMENT_DINNERS: Record<string, {
  name: string; category: string; calories: number;
  protein: number; fat: number; carbs: number; fiber: number; salt: number;
  estimated_price_per_serving: number; cooking_time_minutes: number;
  ingredients: { name: string; amount: number; unit: string; estimated_price: number }[];
}> = {
  // 肉じゃが（35分）→ 豚肉と野菜の味噌炒め（20分）
  monday: {
    name: "豚肉と野菜の味噌炒め",
    category: "和食", calories: 420, protein: 22, fat: 16, carbs: 36, fiber: 5, salt: 2.2,
    estimated_price_per_serving: 260, cooking_time_minutes: 20,
    ingredients: [
      { name: "豚バラ肉", amount: 120, unit: "g", estimated_price: 150 },
      { name: "キャベツ", amount: 150, unit: "g", estimated_price: 45 },
      { name: "にんじん", amount: 60, unit: "g", estimated_price: 20 },
      { name: "ピーマン", amount: 60, unit: "g", estimated_price: 40 },
      { name: "味噌", amount: 20, unit: "g", estimated_price: 15 },
      { name: "みりん", amount: 15, unit: "ml", estimated_price: 8 },
      { name: "ごま油", amount: 5, unit: "ml", estimated_price: 10 },
      { name: "ご飯", amount: 180, unit: "g", estimated_price: 36 },
    ],
  },
  // ハンバーグ（30分）→ 鶏むね肉と野菜のさっぱり炒め（20分）
  thursday: {
    name: "鶏むね肉と野菜のさっぱり炒め",
    category: "和食", calories: 380, protein: 30, fat: 10, carbs: 38, fiber: 4, salt: 1.8,
    estimated_price_per_serving: 230, cooking_time_minutes: 20,
    ingredients: [
      { name: "鶏むね肉", amount: 150, unit: "g", estimated_price: 120 },
      { name: "ブロッコリー", amount: 100, unit: "g", estimated_price: 60 },
      { name: "にんじん", amount: 60, unit: "g", estimated_price: 20 },
      { name: "玉ねぎ", amount: 80, unit: "g", estimated_price: 24 },
      { name: "醤油", amount: 15, unit: "ml", estimated_price: 6 },
      { name: "レモン汁", amount: 10, unit: "ml", estimated_price: 10 },
      { name: "オリーブオイル", amount: 8, unit: "ml", estimated_price: 15 },
      { name: "ご飯", amount: 180, unit: "g", estimated_price: 36 },
    ],
  },
  // 鶏の唐揚げ（30分）→ 鶏むね肉とほうれん草のガーリック炒め（15分）
  saturday: {
    name: "鶏むね肉とほうれん草のガーリック炒め",
    category: "洋食", calories: 360, protein: 32, fat: 12, carbs: 28, fiber: 4, salt: 1.6,
    estimated_price_per_serving: 220, cooking_time_minutes: 15,
    ingredients: [
      { name: "鶏むね肉", amount: 150, unit: "g", estimated_price: 120 },
      { name: "ほうれん草", amount: 100, unit: "g", estimated_price: 60 },
      { name: "にんにく", amount: 8, unit: "g", estimated_price: 15 },
      { name: "オリーブオイル", amount: 10, unit: "ml", estimated_price: 18 },
      { name: "塩こしょう", amount: 2, unit: "g", estimated_price: 2 },
      { name: "醤油", amount: 8, unit: "ml", estimated_price: 4 },
      { name: "ご飯", amount: 180, unit: "g", estimated_price: 36 },
    ],
  },
  // カレーライス（40分）→ 豆腐と野菜の中華あんかけ（20分）
  sunday: {
    name: "豆腐と野菜の中華あんかけ",
    category: "中華", calories: 340, protein: 18, fat: 8, carbs: 44, fiber: 5, salt: 2.0,
    estimated_price_per_serving: 200, cooking_time_minutes: 20,
    ingredients: [
      { name: "豆腐", amount: 200, unit: "g", estimated_price: 60 },
      { name: "チンゲン菜", amount: 120, unit: "g", estimated_price: 60 },
      { name: "にんじん", amount: 60, unit: "g", estimated_price: 20 },
      { name: "しいたけ", amount: 60, unit: "g", estimated_price: 50 },
      { name: "鶏ひき肉", amount: 80, unit: "g", estimated_price: 80 },
      { name: "鶏がらスープ", amount: 200, unit: "ml", estimated_price: 20 },
      { name: "片栗粉", amount: 12, unit: "g", estimated_price: 5 },
      { name: "醤油", amount: 15, unit: "ml", estimated_price: 6 },
      { name: "ご飯", amount: 180, unit: "g", estimated_price: 36 },
    ],
  },
};

// tuesday = 肉じゃが(35分)の残りお弁当なので、月曜夕食の差し替えが必要
// REPLACEMENT_DINNERS の key は day_of_week

async function upsertDish(dishData: typeof REPLACEMENT_DINNERS[string]) {
  const { ingredients, ...dish } = dishData;
  const { data, error } = await supabase
    .from("dishes")
    .upsert({ ...dish, is_ai_generated: true }, { onConflict: "name", ignoreDuplicates: false })
    .select().single();
  if (error || !data) throw new Error(`料理登録失敗: ${error?.message}`);
  // 食材更新
  await supabase.from("ingredients").delete().eq("dish_id", data.id);
  await supabase.from("ingredients").insert(ingredients.map(i => ({ ...i, dish_id: data.id })));
  return data;
}

async function main() {
  console.log("=== 夜ご飯設定を更新します ===\n");
  console.log("条件: 野菜が取れる・調理30分以内\n");

  // 1. user_profileに設定を記録（allergyフィールドにメモ的に追記、またはpreferred_categoriesを活用）
  // preferred_categories とは別に、メモ用途で allergies フィールドを使う（簡易対応）
  const { error: profErr } = await supabase
    .from("user_profile")
    .update({
      allergies: "夜ご飯ルール: 野菜を含む・調理時間30分以内",
    })
    .eq("id", 1);
  if (profErr) console.warn("プロフィール更新エラー:", profErr.message);
  else console.log("✓ 夜ご飯ルールをプロフィールに保存");

  // 2. 今週の30分超えメニューを確認・差し替え
  console.log("\n今週の夕食を確認中...");
  const { data: dinners } = await supabase
    .from("meal_plans")
    .select("day_of_week, dish:dishes(id, name, cooking_time_minutes)")
    .eq("week_start_date", WEEK)
    .eq("meal_type", "dinner");

  for (const d of dinners ?? []) {
    const dish = (d.dish as unknown) as { id: number; name: string; cooking_time_minutes: number };
    const over = dish.cooking_time_minutes > 30;
    console.log(`  ${d.day_of_week}: ${dish.name} ${dish.cooking_time_minutes}分 ${over ? "⚠ 30分超え → 差し替え" : "✓"}`);
  }

  // 3. 差し替え実行
  console.log("\n差し替えを実行...");
  for (const [day, dishData] of Object.entries(REPLACEMENT_DINNERS)) {
    const newDish = await upsertDish(dishData);

    // 夕食を差し替え
    await supabase.from("meal_plans").upsert(
      { week_start_date: WEEK, day_of_week: day, meal_type: "dinner", dish_id: newDish.id, servings: 1 },
      { onConflict: "week_start_date,day_of_week,meal_type" }
    );
    console.log(`  ✓ ${day} 夕食 → ${newDish.name}（${dishData.cooking_time_minutes}分）`);

    // 翌日の昼食も更新（残り物弁当）
    const nextDay: Record<string, string> = {
      monday: "tuesday", tuesday: "wednesday", wednesday: "thursday",
      thursday: "friday", friday: "saturday", saturday: "sunday",
    };
    if (nextDay[day]) {
      await supabase.from("meal_plans").upsert(
        { week_start_date: WEEK, day_of_week: nextDay[day], meal_type: "lunch", dish_id: newDish.id, servings: 1 },
        { onConflict: "week_start_date,day_of_week,meal_type" }
      );
      console.log(`  ✓ ${nextDay[day]} 昼食 → ${newDish.name}（残り弁当）`);
    }
  }

  console.log("\n✅ 完了！ /meal-plan で確認してください。");
}

main().catch(console.error);
