#!/usr/bin/env ts-node
/**
 * 食品成分DBシードスクリプト
 *
 * 使い方:
 *   1. 文部科学省 食品成分データベース (https://fooddb.mext.go.jp/) からCSVをダウンロード
 *   2. data/food_nutrition.csv に配置
 *   3. npx ts-node scripts/seed-nutrition-db.ts を実行
 */

import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Basic built-in nutrition data for common ingredients (per 100g)
const BASIC_NUTRITION_DATA = [
  { name: "白米（炊き）", calories: 168, protein: 2.5, fat: 0.3, carbs: 37.1, fiber: 0.3, salt: 0 },
  { name: "食パン", calories: 264, protein: 9.3, fat: 4.4, carbs: 46.7, fiber: 2.3, salt: 1.2 },
  { name: "鶏もも肉", calories: 190, protein: 16.2, fat: 14.0, carbs: 0, fiber: 0, salt: 0.1 },
  { name: "豚ロース", calories: 263, protein: 19.3, fat: 19.2, carbs: 0.2, fiber: 0, salt: 0.1 },
  { name: "牛もも肉", calories: 176, protein: 21.3, fat: 9.6, carbs: 0.5, fiber: 0, salt: 0.1 },
  { name: "卵", calories: 151, protein: 12.3, fat: 10.3, carbs: 0.3, fiber: 0, salt: 0.4 },
  { name: "牛乳", calories: 67, protein: 3.3, fat: 3.8, carbs: 4.8, fiber: 0, salt: 0.1 },
  { name: "豆腐（木綿）", calories: 72, protein: 6.6, fat: 4.2, carbs: 1.6, fiber: 0.4, salt: 0 },
  { name: "納豆", calories: 200, protein: 16.5, fat: 10.0, carbs: 12.1, fiber: 6.7, salt: 0 },
  { name: "キャベツ", calories: 23, protein: 1.3, fat: 0.2, carbs: 5.2, fiber: 1.8, salt: 0 },
  { name: "玉ねぎ", calories: 37, protein: 1.0, fat: 0.1, carbs: 8.8, fiber: 1.5, salt: 0 },
  { name: "にんじん", calories: 37, protein: 0.7, fat: 0.1, carbs: 8.7, fiber: 2.8, salt: 0.1 },
  { name: "じゃがいも", calories: 76, protein: 1.8, fat: 0.1, carbs: 17.3, fiber: 1.3, salt: 0 },
  { name: "ほうれん草", calories: 20, protein: 2.2, fat: 0.4, carbs: 3.1, fiber: 2.8, salt: 0 },
  { name: "トマト", calories: 19, protein: 0.7, fat: 0.1, carbs: 4.7, fiber: 1.0, salt: 0 },
];

async function main() {
  console.log("=== 食品成分DBシード ===");

  const csvPath = path.resolve(__dirname, "../data/food_nutrition.csv");

  if (fs.existsSync(csvPath)) {
    console.log(`CSV ファイルを読み込みます: ${csvPath}`);
    // CSV parsing would go here for the full database
    console.log("⚠ CSV解析機能は省略されています。手動で実装してください。");
  } else {
    console.log("CSVファイルが見つかりません。基本データのみ投入します。");
  }

  // Insert basic nutrition data as dishes
  console.log("\n基本栄養データを登録します...");
  for (const item of BASIC_NUTRITION_DATA) {
    const { error } = await supabase.from("dishes").upsert(
      {
        name: item.name,
        category: "その他",
        dish_type: "main",
        calories: item.calories,
        protein: item.protein,
        fat: item.fat,
        carbs: item.carbs,
        fiber: item.fiber,
        salt: item.salt,
        source_site: "manual",
      },
      { onConflict: "name", ignoreDuplicates: true }
    );
    if (!error) console.log(`✓ ${item.name}`);
    else console.error(`✗ ${item.name}: ${error.message}`);
  }

  console.log("\n✅ シード完了！");
  console.log("文部科学省 食品成分DB (https://fooddb.mext.go.jp/) からCSVをダウンロードして");
  console.log("data/food_nutrition.csv に配置することで、より詳細なデータが利用できます。");
}

main().catch(console.error);
