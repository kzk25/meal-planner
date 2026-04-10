/**
 * 今週の昼食を「前日の夕食の残り（お弁当）」に更新する
 * 月曜昼食だけ前週のデータがないのでそのまま残す
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

// 昼食 → 前日の夕食のマッピング（月曜昼はスキップ）
const LUNCH_FROM_PREV_DINNER: { lunch_day: string; dinner_day: string }[] = [
  { lunch_day: "tuesday",   dinner_day: "monday"    },
  { lunch_day: "wednesday", dinner_day: "tuesday"   },
  { lunch_day: "thursday",  dinner_day: "wednesday" },
  { lunch_day: "friday",    dinner_day: "thursday"  },
  { lunch_day: "saturday",  dinner_day: "friday"    },
  { lunch_day: "sunday",    dinner_day: "saturday"  },
];

// user_profile の default_servings を 4 に更新（夜ご飯は4人前）
async function updateServings() {
  const { error } = await supabase
    .from("user_profile")
    .update({ default_servings: 4 })
    .eq("id", 1);
  if (error) console.warn("servings更新エラー:", error.message);
  else console.log("✓ default_servings を 4（夜ご飯4人前）に更新");
}

async function main() {
  console.log("=== お弁当設定を反映します ===\n");

  await updateServings();

  // 今週の夕食を全取得
  const { data: dinners, error } = await supabase
    .from("meal_plans")
    .select("day_of_week, dish_id")
    .eq("week_start_date", WEEK)
    .eq("meal_type", "dinner");

  if (error || !dinners) {
    console.error("夕食データの取得に失敗:", error?.message);
    process.exit(1);
  }

  const dinnerMap = new Map(dinners.map((d) => [d.day_of_week, d.dish_id]));

  for (const { lunch_day, dinner_day } of LUNCH_FROM_PREV_DINNER) {
    const dish_id = dinnerMap.get(dinner_day);
    if (!dish_id) {
      console.log(`  ⚠ ${dinner_day} の夕食が未設定のためスキップ`);
      continue;
    }

    const { error: upsertErr } = await supabase.from("meal_plans").upsert(
      {
        week_start_date: WEEK,
        day_of_week: lunch_day,
        meal_type: "lunch",
        dish_id,
        servings: 1,
      },
      { onConflict: "week_start_date,day_of_week,meal_type" }
    );

    if (upsertErr) {
      console.error(`  ${lunch_day} 昼食の更新失敗:`, upsertErr.message);
    } else {
      // dish名を取得して表示
      const { data: dish } = await supabase.from("dishes").select("name").eq("id", dish_id).single();
      console.log(`  ✓ ${lunch_day} 昼食 → ${dish?.name ?? dish_id}（${dinner_day}の残り）`);
    }
  }

  console.log("\n✅ 完了しました！ /meal-plan で確認してください。");
}

main().catch(console.error);
