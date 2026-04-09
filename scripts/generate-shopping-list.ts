#!/usr/bin/env ts-node
/**
 * 買い物リスト生成スクリプト（Claude Codeから直接呼び出し用）
 *
 * 使い方:
 *   npx ts-node scripts/generate-shopping-list.ts
 */

import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

async function main() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const today = new Date();
  const day = today.getDay();
  const diff = today.getDate() - day + (day === 0 ? -6 : 1);
  today.setDate(diff);
  today.setHours(0, 0, 0, 0);
  const weekStartDate = today.toISOString().split("T")[0];

  console.log(`買い物リストを生成します（週: ${weekStartDate}）...`);

  const res = await fetch(`${appUrl}/api/shopping-list/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ week_start_date: weekStartDate }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("エラー:", err);
    process.exit(1);
  }

  const result = await res.json();
  console.log(`✅ 買い物リスト生成完了 (${result.count}品)`);
  console.log("ブラウザで /shopping-list を開いて確認してください。");
}

main().catch(console.error);
