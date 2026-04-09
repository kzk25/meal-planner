import { createServerClient } from "@/lib/supabase-server";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const { week_start_date } = await request.json();
  if (!week_start_date) {
    return Response.json({ error: "week_start_date required" }, { status: 400 });
  }

  const db = createServerClient();

  // Get meal plans for the week with ingredients
  const { data: plans } = await db
    .from("meal_plans")
    .select(`servings, dish:dishes(id, name, estimated_price_per_serving, ingredients(name, amount, unit, estimated_price))`)
    .eq("week_start_date", week_start_date);

  if (!plans || plans.length === 0) {
    return Response.json({ message: "No meal plans found for this week" });
  }

  // Aggregate ingredients
  const ingredientMap = new Map<string, {
    name: string;
    total_amount: number;
    unit: string;
    category: string;
    estimated_price: number;
  }>();

  for (const plan of plans) {
    const dish = plan.dish as {
      ingredients?: Array<{ name: string; amount?: number; unit?: string; estimated_price?: number }>;
    } | null;
    if (!dish?.ingredients) continue;
    const servings = plan.servings ?? 1;

    for (const ing of dish.ingredients) {
      const key = ing.name.toLowerCase();
      const existing = ingredientMap.get(key);
      const amount = (ing.amount ?? 0) * servings;
      const price = (ing.estimated_price ?? 0) * servings;

      if (existing) {
        existing.total_amount += amount;
        existing.estimated_price += price;
      } else {
        ingredientMap.set(key, {
          name: ing.name,
          total_amount: amount,
          unit: ing.unit ?? "",
          category: categorizeIngredient(ing.name),
          estimated_price: price,
        });
      }
    }
  }

  // Delete existing items for this week
  await db.from("shopping_items").delete().eq("week_start_date", week_start_date);

  // Insert aggregated items
  const items = Array.from(ingredientMap.values()).map((ing) => ({
    week_start_date,
    ingredient_name: ing.name,
    total_amount: ing.total_amount > 0 ? ing.total_amount : null,
    unit: ing.unit || null,
    category: ing.category,
    estimated_price: ing.estimated_price > 0 ? Math.round(ing.estimated_price) : null,
    is_purchased: false,
    add_to_fridge: true,
  }));

  if (items.length > 0) {
    await db.from("shopping_items").insert(items);
  }

  return Response.json({ success: true, count: items.length });
}

function categorizeIngredient(name: string): string {
  const n = name.toLowerCase();
  if (/キャベツ|玉ねぎ|人参|にんじん|大根|じゃがいも|さつまいも|トマト|きゅうり|なす|ピーマン|ほうれん草|小松菜|レタス|白菜|ねぎ|しょうが|にんにく|きのこ|しいたけ|えのき|りんご|バナナ|みかん/.test(n)) return "野菜・果物";
  if (/豚|牛|鶏|肉|ひき肉|ハム|ベーコン|ソーセージ|魚|鮭|さば|まぐろ|えび|いか|あさり|ちくわ|かまぼこ/.test(n)) return "肉・魚";
  if (/卵|たまご|牛乳|ミルク|チーズ|バター|ヨーグルト|豆腐|納豆|豆乳/.test(n)) return "乳製品・卵";
  if (/米|パスタ|うどん|そば|小麦粉|片栗粉|パン粉|乾麺|海苔/.test(n)) return "乾物・穀物";
  if (/醤油|みそ|みりん|酒|砂糖|塩|酢|油|ごま油|オリーブ油|ケチャップ|ソース|マヨネーズ/.test(n)) return "調味料";
  return "その他";
}
