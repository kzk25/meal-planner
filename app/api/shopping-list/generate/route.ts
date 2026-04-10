export const runtime = 'edge';
import { createServerClient } from "@/lib/supabase-server";
import { NextRequest } from "next/server";

// 曜日の順番
const DAY_ORDER: Record<string, number> = {
  monday: 0, tuesday: 1, wednesday: 2, thursday: 3,
  friday: 4, saturday: 5, sunday: 6,
};

// カロリー計算用として追加した白米・ご飯は買い物リストでは「お米」として1つにまとめる
const RICE_NAMES = new Set(["白米", "ご飯", "白米(ご飯)", "ライス"]);

export async function POST(request: NextRequest) {
  const { week_start_date } = await request.json();
  if (!week_start_date) {
    return Response.json({ error: "week_start_date required" }, { status: 400 });
  }

  const db = createServerClient();

  // 今週の全献立を取得（曜日・食事タイプ・dish_idを含む）
  const { data: plans, error: plansError } = await db
    .from("meal_plans")
    .select(`
      day_of_week,
      meal_type,
      servings,
      dish_id,
      dish:dishes(id, name, estimated_price_per_serving, ingredients(name, amount, unit, estimated_price))
    `)
    .eq("week_start_date", week_start_date);

  if (plansError) return Response.json({ error: plansError.message }, { status: 500 });
  if (!plans || plans.length === 0) {
    return Response.json({ message: "No meal plans found for this week" });
  }

  // 前日の夕食dish_idを取得（昼食が残り物かどうかの判定用）
  // day_of_week ごとに dinnerのdish_idをマップ
  const dinnerByDay = new Map<number, number>(); // dayOrder → dish_id
  for (const plan of plans) {
    if (plan.meal_type === "dinner") {
      const order = DAY_ORDER[plan.day_of_week] ?? -1;
      if (order >= 0) dinnerByDay.set(order, plan.dish_id);
    }
  }

  // 各planの実際の購入倍率を決定
  //   - 夕食: 4人前（2人が今日食べる + 2人分が翌日の弁当になる）
  //   - 朝食: 1人前（ユーザー本人の朝食）
  //   - 昼食: 前日の夕食と同じdishなら残り物なので0倍（購入不要）
  //           月曜昼食など前日夕食と異なる場合は1人前
  const DINNER_SERVINGS = 4;

  const ingredientMap = new Map<string, {
    name: string;
    total_amount: number;
    unit: string;
    category: string;
    estimated_price: number;
  }>();

  // 白米の合計グラムを別管理（重複排除のため）
  let totalRiceGrams = 0;

  for (const plan of plans) {
    const dayOrder = DAY_ORDER[plan.day_of_week] ?? -1;
    const dish = plan.dish as {
      id?: number;
      ingredients?: Array<{ name: string; amount?: number; unit?: string; estimated_price?: number }>;
    } | null;
    if (!dish?.ingredients) continue;

    // 購入倍率を計算
    let purchaseMultiplier: number;
    if (plan.meal_type === "dinner") {
      purchaseMultiplier = DINNER_SERVINGS;
    } else if (plan.meal_type === "lunch") {
      const prevDayOrder = dayOrder - 1;
      const prevDinnerDishId = dinnerByDay.get(prevDayOrder);
      // 前日の夕食と同じdishなら残り物 → 購入不要
      if (prevDinnerDishId !== undefined && prevDinnerDishId === plan.dish_id) {
        purchaseMultiplier = 0;
      } else {
        purchaseMultiplier = plan.servings ?? 1;
      }
    } else {
      // breakfast
      purchaseMultiplier = plan.servings ?? 1;
    }

    if (purchaseMultiplier === 0) continue;

    for (const ing of dish.ingredients) {
      const ingName = ing.name.trim();

      // 白米・ご飯は別管理（全メニュー合算して1つのお米として表示）
      if (RICE_NAMES.has(ingName)) {
        totalRiceGrams += (ing.amount ?? 0) * purchaseMultiplier;
        continue;
      }

      const key = ingName.toLowerCase();
      const existing = ingredientMap.get(key);
      const amount = (ing.amount ?? 0) * purchaseMultiplier;
      const price = (ing.estimated_price ?? 0) * purchaseMultiplier;

      if (existing) {
        existing.total_amount += amount;
        existing.estimated_price += price;
      } else {
        ingredientMap.set(key, {
          name: ingName,
          total_amount: amount,
          unit: ing.unit ?? "",
          category: categorizeIngredient(ingName),
          estimated_price: price,
        });
      }
    }
  }

  // Delete existing items for this week
  await db.from("shopping_items").delete().eq("week_start_date", week_start_date);

  // Build items list
  const items: {
    week_start_date: string;
    ingredient_name: string;
    total_amount: number | null;
    unit: string | null;
    category: string;
    estimated_price: number | null;
    is_purchased: boolean;
    add_to_fridge: boolean;
  }[] = [];

  // お米をまず追加（まとめて1行）
  if (totalRiceGrams > 0) {
    // グラムをkgに変換（1000g以上なら）
    const riceKg = totalRiceGrams / 1000;
    items.push({
      week_start_date,
      ingredient_name: "白米",
      total_amount: Math.ceil(riceKg * 10) / 10, // 小数点1桁に丸め
      unit: "kg",
      category: "乾物・穀物",
      estimated_price: Math.round(riceKg * 400), // 約400円/kg
      is_purchased: false,
      add_to_fridge: true,
    });
  }

  // その他の食材を追加
  for (const ing of ingredientMap.values()) {
    items.push({
      week_start_date,
      ingredient_name: ing.name,
      total_amount: ing.total_amount > 0 ? Math.round(ing.total_amount * 10) / 10 : null,
      unit: ing.unit || null,
      category: ing.category,
      estimated_price: ing.estimated_price > 0 ? Math.round(ing.estimated_price) : null,
      is_purchased: false,
      add_to_fridge: true,
    });
  }

  if (items.length > 0) {
    await db.from("shopping_items").insert(items);
  }

  return Response.json({ success: true, count: items.length });
}

function categorizeIngredient(name: string): string {
  const n = name;
  if (/キャベツ|玉ねぎ|人参|にんじん|大根|じゃがいも|さつまいも|トマト|きゅうり|なす|ピーマン|ほうれん草|小松菜|レタス|白菜|ねぎ|しょうが|にんにく|きのこ|しいたけ|えのき|りんご|バナナ|みかん|ベリー|冷凍/.test(n)) return "野菜・果物";
  if (/豚|牛|鶏|肉|ひき肉|ハム|ベーコン|ソーセージ|魚|鮭|さば|まぐろ|えび|いか|あさり|ちくわ|かまぼこ/.test(n)) return "肉・魚";
  if (/卵|たまご|牛乳|ミルク|チーズ|バター|ヨーグルト|豆腐|納豆|豆乳/.test(n)) return "乳製品・卵";
  if (/米|パスタ|うどん|そば|小麦粉|片栗粉|パン粉|乾麺|海苔|オートミール/.test(n)) return "乾物・穀物";
  if (/醤油|みそ|みりん|酒|砂糖|塩|酢|油|ごま油|オリーブ油|ケチャップ|ソース|マヨネーズ|レモン|塩こしょう/.test(n)) return "調味料";
  return "その他";
}
