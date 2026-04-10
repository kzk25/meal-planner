#!/usr/bin/env ts-node
/**
 * 週間献立生成スクリプト
 *
 * 使い方:
 *   npx ts-node scripts/generate-meal-plan.ts
 *   または Claude Code に「今週の献立を提案して」と伝えて実行してもらう
 *
 * 処理フロー:
 * 1. DBからユーザー設定を読み込む
 * 2. 過去4週間の献立履歴を読み込む（重複回避）
 * 3. 冷蔵庫の残り食材を読み込む
 * 4. このスクリプトを実行しているClaude Codeが献立を考える
 * 5. 生成した献立をDBに書き込む
 * 6. 買い物リストも生成してDBに書き込む
 */

import * as dotenv from "dotenv";
import * as path from "path";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function getWeekStartDate(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().split("T")[0];
}

async function main() {
  console.log("=== 週間献立生成スクリプト ===\n");

  const weekStartDate = getWeekStartDate();
  console.log(`対象週: ${weekStartDate}`);

  // Load user settings
  const { data: profile } = await supabase.from("user_profile").select("*").eq("id", 1).single();
  console.log("\n【ユーザー設定】");
  const servings = profile?.default_servings ?? 4;
  console.log(`- 夜ご飯の分量: ${servings}人前（2人で食べて残りを翌日のお弁当に）`);
  console.log(`- 朝食: ベリーヨーグルトオートミール（固定）`);
  console.log(`- 昼食: 前日夕食の残り（お弁当）※月曜のみ別途提案`);

  console.log(`- カテゴリ: ${JSON.stringify(profile?.preferred_categories ?? ["和食", "洋食", "中華"])}`);
  console.log(`- 副菜: ${profile?.include_side_dish ? "あり" : "なし"}`);
  console.log(`- 汁物: ${profile?.include_soup ? "あり" : "なし"}`);
  console.log(`- 1食目標金額: ¥${profile?.meal_budget_per_meal ?? 500}`);
  console.log(`\n【夜ご飯のルール（必須）】`);
  console.log(`- 野菜を必ず含めること（葉物・根菜・きのこ類など何でも可）`);
  console.log(`- 調理時間は30分以内のものを選ぶこと`);
  console.log(`- 月曜昼食のみ単品で提案（他の昼食は前日夕食の残りで自動設定）`);

  // Load past 4 weeks of meal history
  const fourWeeksAgo = new Date();
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
  const { data: history } = await supabase
    .from("meal_plans")
    .select("dish:dishes(name)")
    .gte("week_start_date", fourWeeksAgo.toISOString().split("T")[0]);

  const recentDishes = new Set(
    (history ?? []).map((h: { dish?: { name?: string } | { name?: string }[] | null }) => {
      const dish = h.dish;
      if (!dish) return undefined;
      if (Array.isArray(dish)) return dish[0]?.name;
      return (dish as { name?: string }).name;
    }).filter(Boolean)
  );
  console.log(`\n【最近4週間の献立（重複回避対象）】`);
  console.log([...recentDishes].join(", ") || "（なし）");

  // Load fridge items
  const { data: fridge } = await supabase
    .from("fridge_items")
    .select("name, amount, unit, expiry_date")
    .eq("is_finished", false);

  if (fridge && fridge.length > 0) {
    console.log("\n【冷蔵庫の残り食材】");
    fridge.forEach((f: { name: string; amount?: number; unit?: string; expiry_date?: string }) => {
      console.log(`- ${f.name}${f.amount ? ` ${f.amount}${f.unit ?? ""}` : ""}${f.expiry_date ? ` (期限: ${f.expiry_date})` : ""}`);
    });
  }

  console.log("\n" + "=".repeat(50));
  console.log("💡 Claude Code はここで献立を考えて、以下の形式でDBに書き込んでください。");
  console.log("=".repeat(50));
  console.log(`
使用するデータ形式:

await writeMealPlan(weekStartDate, [
  {
    day: "monday",
    breakfast: { name: "料理名", category: "和食", dish_type: "main", calories: 400, protein: 15, fat: 10, carbs: 55, fiber: 2, salt: 1.0, estimated_price_per_serving: 200, cooking_time_minutes: 10, ingredients: [{name: "食材", amount: 100, unit: "g", estimated_price: 50}] },
    lunch: { ... },
    dinner: { ..., side_dishes: [{ name: "副菜" }], soup: { name: "汁物" } },
  },
  // 火〜日曜も同様に
]);
`);

  console.log("ヒント: writeMealPlan 関数を使って上記形式のデータを生成・書き込みできます。");
  console.log("または、以下の writeToDB 関数を直接呼び出してください。");
}

// デフォルト朝食（毎週固定）
const DEFAULT_BREAKFAST = "ベリーヨーグルトオートミール";
const DAYS_OF_WEEK = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

async function setDefaultBreakfast(weekStartDate: string) {
  const { data: dish } = await supabase
    .from("dishes")
    .select("id")
    .eq("name", DEFAULT_BREAKFAST)
    .single();
  if (!dish) return;
  for (const day of DAYS_OF_WEEK) {
    await supabase.from("meal_plans").upsert(
      { week_start_date: weekStartDate, day_of_week: day, meal_type: "breakfast", dish_id: dish.id, servings: 1 },
      { onConflict: "week_start_date,day_of_week,meal_type" }
    );
  }
  console.log(`✓ 朝食をデフォルト（${DEFAULT_BREAKFAST}）で設定しました`);
}

export async function writeToDB(weekStartDate: string, mealPlanData: MealPlanInput[]) {
  console.log(`\n${weekStartDate} の献立をDBに書き込みます...`);

  // 1. デフォルト朝食を全日設定
  await setDefaultBreakfast(weekStartDate);

  for (const dayData of mealPlanData) {
    for (const mealType of ["breakfast", "lunch", "dinner"] as const) {
      const meal = dayData[mealType];
      if (!meal) continue;

      // Upsert dish
      const { data: dish, error: dishError } = await supabase
        .from("dishes")
        .upsert(
          {
            name: meal.name,
            category: meal.category ?? "その他",
            dish_type: meal.dish_type ?? "main",
            calories: meal.calories,
            protein: meal.protein,
            fat: meal.fat,
            carbs: meal.carbs,
            fiber: meal.fiber,
            salt: meal.salt,
            estimated_price_per_serving: meal.estimated_price_per_serving,
            cooking_time_minutes: meal.cooking_time_minutes,
            is_ai_generated: true,
          },
          { onConflict: "name", ignoreDuplicates: false }
        )
        .select()
        .single();

      if (dishError) {
        console.error(`料理「${meal.name}」の書き込みエラー:`, dishError.message);
        continue;
      }

      // Insert ingredients
      if (meal.ingredients && dish) {
        await supabase.from("ingredients").delete().eq("dish_id", dish.id);
        await supabase.from("ingredients").insert(
          meal.ingredients.map((ing) => ({ ...ing, dish_id: dish.id }))
        );
      }

      // Upsert meal plan
      await supabase.from("meal_plans").upsert(
        {
          week_start_date: weekStartDate,
          day_of_week: dayData.day,
          meal_type: mealType,
          dish_id: dish?.id,
          servings: 1,
        },
        { onConflict: "week_start_date,day_of_week,meal_type" }
      );

      console.log(`✓ ${dayData.day} ${mealType}: ${meal.name}`);
    }
  }

  // 2. 昼食を「前日の夕食の残り（お弁当）」に設定
  //    月曜昼のみ前週データが必要なためスキップ
  const LUNCH_FROM_PREV: { lunch: string; dinner: string }[] = [
    { lunch: "tuesday",   dinner: "monday"    },
    { lunch: "wednesday", dinner: "tuesday"   },
    { lunch: "thursday",  dinner: "wednesday" },
    { lunch: "friday",    dinner: "thursday"  },
    { lunch: "saturday",  dinner: "friday"    },
    { lunch: "sunday",    dinner: "saturday"  },
  ];
  // 今週書き込んだ夕食のdish_idを取得
  const { data: dinners } = await supabase
    .from("meal_plans")
    .select("day_of_week, dish_id")
    .eq("week_start_date", weekStartDate)
    .eq("meal_type", "dinner");
  const dinnerMap = new Map((dinners ?? []).map((d: { day_of_week: string; dish_id: number }) => [d.day_of_week, d.dish_id]));
  for (const { lunch, dinner } of LUNCH_FROM_PREV) {
    const dish_id = dinnerMap.get(dinner);
    if (!dish_id) continue;
    await supabase.from("meal_plans").upsert(
      { week_start_date: weekStartDate, day_of_week: lunch, meal_type: "lunch", dish_id, servings: 1 },
      { onConflict: "week_start_date,day_of_week,meal_type" }
    );
    console.log(`✓ ${lunch} 昼食 → ${dinner}の残りに設定`);
  }

  // Generate shopping list
  console.log("\n買い物リストを生成します...");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  try {
    const res = await fetch(`${appUrl}/api/shopping-list/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ week_start_date: weekStartDate }),
    });
    if (res.ok) {
      const result = await res.json();
      console.log(`✓ 買い物リスト生成完了 (${result.count}品)`);
    }
  } catch {
    console.log("⚠ 買い物リスト自動生成をスキップ（アプリが起動していません）");
  }

  console.log("\n✅ 献立の書き込みが完了しました！");
  console.log("ブラウザで /meal-plan を開いて確認してください。");
}

interface MealItem {
  name: string;
  category?: string;
  dish_type?: string;
  calories?: number;
  protein?: number;
  fat?: number;
  carbs?: number;
  fiber?: number;
  salt?: number;
  estimated_price_per_serving?: number;
  cooking_time_minutes?: number;
  ingredients?: Array<{ name: string; amount?: number; unit?: string; estimated_price?: number }>;
  side_dishes?: MealItem[];
  soup?: MealItem | null;
}

interface MealPlanInput {
  day: string;
  breakfast?: MealItem;
  lunch?: MealItem;
  dinner?: MealItem;
}

export { main };

main().catch(console.error);
