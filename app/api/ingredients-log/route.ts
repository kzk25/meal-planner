import { createServerClient } from "@/lib/supabase-server";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const weeks = parseInt(searchParams.get("weeks") ?? "4", 10);

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - weeks * 7);
  const cutoffStr = cutoff.toISOString().split("T")[0];

  const db = createServerClient();
  const { data, error } = await db
    .from("shopping_items")
    .select("ingredient_name, category, estimated_price, actual_price, week_start_date")
    .gte("week_start_date", cutoffStr);

  if (error) return Response.json({ error: error.message }, { status: 500 });

  // Group by ingredient_name
  const grouped = new Map<
    string,
    { name: string; category: string; count: number; total_estimated: number; total_actual: number }
  >();

  for (const item of data ?? []) {
    const key = item.ingredient_name;
    if (!grouped.has(key)) {
      grouped.set(key, {
        name: item.ingredient_name,
        category: item.category ?? "その他",
        count: 0,
        total_estimated: 0,
        total_actual: 0,
      });
    }
    const entry = grouped.get(key)!;
    entry.count += 1;
    if (item.estimated_price) entry.total_estimated += item.estimated_price;
    if (item.actual_price) entry.total_actual += item.actual_price;
  }

  const result = Array.from(grouped.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 30);

  return Response.json(result);
}
