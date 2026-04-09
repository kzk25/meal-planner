#!/usr/bin/env ts-node
/**
 * 冷蔵庫の残り物から献立生成スクリプト
 *
 * 使い方:
 *   npx ts-node scripts/generate-meal-plan-from-fridge.ts
 *   または Claude Code に「冷蔵庫の残り物で献立を提案して」と伝えて実行してもらう
 */

import * as dotenv from "dotenv";
import * as path from "path";
import { createClient } from "@supabase/supabase-js";
import { writeToDB } from "./generate-meal-plan";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  console.log("=== 冷蔵庫の残り物から献立生成 ===\n");

  // Get fridge items sorted by expiry date
  const { data: fridge } = await supabase
    .from("fridge_items")
    .select("*")
    .eq("is_finished", false)
    .order("expiry_date", { ascending: true, nullsFirst: false });

  if (!fridge || fridge.length === 0) {
    console.log("冷蔵庫に食材が登録されていません。");
    console.log("/fridge ページから食材を登録してください。");
    return;
  }

  console.log("【現在の冷蔵庫の中身（賞味期限が近い順）】");
  fridge.forEach((item: { name: string; amount?: number; unit?: string; expiry_date?: string }) => {
    const daysLeft = item.expiry_date
      ? Math.floor((new Date(item.expiry_date).getTime() - Date.now()) / 86400000)
      : null;
    const urgency = daysLeft !== null
      ? daysLeft <= 1 ? " 🔴 期限切れ間近!" : daysLeft <= 2 ? " 🟡 もうすぐ期限" : " 🟢"
      : "";
    console.log(`- ${item.name}${item.amount ? ` ${item.amount}${item.unit ?? ""}` : ""}${item.expiry_date ? ` (期限: ${item.expiry_date}${urgency})` : ""}`);
  });

  console.log("\n" + "=".repeat(50));
  console.log("💡 上記の食材を使い切る献立を提案して、writeToDB を呼び出してください。");
  console.log("賞味期限が近い食材を優先的に使う献立にしてください。");
  console.log("=".repeat(50));

  // Export for Claude Code to use
  console.log("\nexport const fridgeItems =", JSON.stringify(fridge, null, 2));
  console.log("\n// writeToDB をインポートして献立をDBに書き込んでください:");
  console.log("// import { writeToDB } from './generate-meal-plan';");
}

main().catch(console.error);
export { writeToDB };
