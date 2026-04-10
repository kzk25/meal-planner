/**
 * generate-cooking-steps.ts
 * Claude AIを使って全メニューの詳細な調理手順を生成してDBに保存するスクリプト
 */
import * as dotenv from "dotenv";
import * as path from "path";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: path.join(__dirname, "../.env.local") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

interface Ingredient {
  name: string;
  amount: number | null;
  unit: string | null;
}

interface Dish {
  id: number;
  name: string;
  category: string | null;
  cooking_time_minutes: number | null;
  cooking_steps: string[] | null;
}

async function generateStepsForDish(
  dish: Dish,
  ingredients: Ingredient[]
): Promise<string[]> {
  const ingList = ingredients
    .map((i) => `・${i.name}${i.amount ? ` ${i.amount}${i.unit ?? ""}` : ""}`)
    .join("\n");

  const prompt = `あなたはプロの料理研究家です。以下の料理の詳細なレシピ手順を日本語で作成してください。

料理名: ${dish.name}
カテゴリ: ${dish.category ?? "その他"}
調理時間: ${dish.cooking_time_minutes ?? 30}分以内

食材:
${ingList}

要件:
- クラシルやデリッシュキッチンレベルの分かりやすい手順
- 各ステップは1〜2文で完結（長すぎない）
- 具体的な火加減、時間、コツを含める
- 下準備→調理→仕上げの流れで書く
- 5〜10ステップ程度
- 白米は別途炊いておくものとして、おかずの作り方のみ記載

JSON配列のみ返してください（マークダウン不要）。例:
["食材を切る。...", "フライパンを熱し...", "..."]`;

  const message = await anthropic.messages.create({
    model: "claude-3-5-haiku-20241022",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  const text =
    message.content[0].type === "text" ? message.content[0].text : "[]";

  // JSON配列を抽出
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) {
    console.warn(`  ⚠ JSON配列が見つかりませんでした: ${text.slice(0, 100)}`);
    return [];
  }

  try {
    const steps = JSON.parse(match[0]) as string[];
    return Array.isArray(steps) ? steps : [];
  } catch {
    console.warn(`  ⚠ JSONパース失敗: ${match[0].slice(0, 100)}`);
    return [];
  }
}

async function main() {
  console.log("🍳 調理手順生成スクリプト開始\n");

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("❌ ANTHROPIC_API_KEY が設定されていません");
    process.exit(1);
  }

  // cooking_stepsが空または未設定のdishを取得
  const { data: dishes, error } = await supabase
    .from("dishes")
    .select("id, name, category, cooking_time_minutes, cooking_steps")
    .order("id");

  if (error) {
    console.error("❌ dishes取得エラー:", error.message);
    process.exit(1);
  }

  const targets = (dishes as Dish[]).filter(
    (d) => !d.cooking_steps || d.cooking_steps.length === 0
  );

  console.log(
    `📋 対象: ${targets.length}件 / 全${dishes!.length}件\n`
  );

  if (targets.length === 0) {
    console.log("✅ 全メニューに調理手順が設定済みです");
    return;
  }

  let successCount = 0;
  let failCount = 0;

  for (const dish of targets) {
    console.log(`🔄 [${dish.id}] ${dish.name}`);

    // 食材を取得
    const { data: ingredients, error: ingError } = await supabase
      .from("ingredients")
      .select("name, amount, unit")
      .eq("dish_id", dish.id)
      .order("id");

    if (ingError) {
      console.warn(`  ⚠ 食材取得エラー: ${ingError.message}`);
    }

    try {
      const steps = await generateStepsForDish(
        dish,
        (ingredients as Ingredient[]) ?? []
      );

      if (steps.length === 0) {
        console.warn(`  ⚠ ステップが生成されませんでした`);
        failCount++;
        continue;
      }

      // DBに保存
      const { error: updateError } = await supabase
        .from("dishes")
        .update({ cooking_steps: steps })
        .eq("id", dish.id);

      if (updateError) {
        console.error(`  ❌ 更新エラー: ${updateError.message}`);
        failCount++;
      } else {
        console.log(`  ✅ ${steps.length}ステップ保存完了`);
        steps.forEach((s, i) => console.log(`     ${i + 1}. ${s}`));
        successCount++;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  ❌ 生成エラー: ${msg}`);
      failCount++;
    }

    // レート制限対策
    await new Promise((r) => setTimeout(r, 500));
    console.log("");
  }

  console.log(`\n📊 完了: 成功 ${successCount}件 / 失敗 ${failCount}件`);
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
