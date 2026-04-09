#!/usr/bin/env ts-node
/**
 * レシートOCRスクリプト
 *
 * 使い方:
 *   npx ts-node scripts/ocr-receipt.ts --image ./receipts/receipt.jpg
 *   または Claude Code に「このレシートを読み取って」と画像を渡す
 *
 * 処理内容:
 * 1. 画像ファイルを読み込む
 * 2. Claude Code が画像を解析して品目・金額を抽出する
 * 3. 買い物リストとマッチングして actual_price を更新する
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

function getWeekStartDate(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().split("T")[0];
}

interface ReceiptItem {
  name: string;
  price: number;
  quantity?: number;
}

export async function updatePricesFromReceipt(items: ReceiptItem[], weekStartDate?: string) {
  const week = weekStartDate ?? getWeekStartDate();
  console.log(`\nレシートのデータを買い物リストに反映します（週: ${week}）`);

  const { data: shoppingItems } = await supabase
    .from("shopping_items")
    .select("*")
    .eq("week_start_date", week);

  let updated = 0;
  for (const receiptItem of items) {
    const matched = (shoppingItems ?? []).find((s: { ingredient_name: string }) =>
      s.ingredient_name.toLowerCase().includes(receiptItem.name.toLowerCase()) ||
      receiptItem.name.toLowerCase().includes(s.ingredient_name.toLowerCase())
    );

    if (matched) {
      await supabase
        .from("shopping_items")
        .update({ actual_price: receiptItem.price })
        .eq("id", matched.id);
      console.log(`✓ マッチ: ${receiptItem.name} → ${matched.ingredient_name} (¥${receiptItem.price})`);
      updated++;
    } else {
      console.log(`- 未マッチ: ${receiptItem.name} (¥${receiptItem.price})`);
    }
  }

  const totalAmount = items.reduce((s, i) => s + i.price * (i.quantity ?? 1), 0);
  await supabase.from("receipts").insert({
    week_start_date: week,
    ocr_result: JSON.stringify(items),
    total_amount: totalAmount,
    purchased_at: new Date().toISOString().split("T")[0],
  });

  console.log(`\n✅ ${updated}/${items.length}件マッチ。合計: ¥${totalAmount}`);
}

async function main() {
  const args = process.argv.slice(2);
  const imageIndex = args.indexOf("--image");
  const imagePath = imageIndex >= 0 ? args[imageIndex + 1] : null;

  if (!imagePath) {
    console.log("使い方: npx ts-node scripts/ocr-receipt.ts --image ./receipts/receipt.jpg");
    console.log("または Claude Code に「このレシートを読み取って」と画像を渡してください。");
    return;
  }

  if (!fs.existsSync(imagePath)) {
    console.error(`ファイルが見つかりません: ${imagePath}`);
    process.exit(1);
  }

  const absolutePath = path.resolve(imagePath);
  console.log(`=== レシートOCR ===`);
  console.log(`画像ファイル: ${absolutePath}`);
  console.log("\n💡 Claude Code はこの画像を読み取り、以下の形式でデータを生成してください:");
  console.log(`
const items: ReceiptItem[] = [
  { name: "品目名", price: 198 },
  { name: "品目名", price: 298, quantity: 2 },
  // ...
];
await updatePricesFromReceipt(items);
`);
}

main().catch(console.error);
