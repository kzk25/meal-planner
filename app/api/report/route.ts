import { createServerClient } from "@/lib/supabase-server";
import { NextRequest } from "next/server";
import { getWeekStartDate, formatWeekStartDate, addDays } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const weeksParam = searchParams.get("weeks");
  const weeks = Math.min(Math.max(parseInt(weeksParam ?? "4", 10) || 4, 1), 52);

  // Build list of week_start dates (most recent first)
  const currentWeekStart = getWeekStartDate(new Date());
  const weekStarts: Date[] = [];
  for (let i = 0; i < weeks; i++) {
    weekStarts.push(addDays(currentWeekStart, -7 * i));
  }

  const db = createServerClient();

  // Fetch all meal_plans for these weeks joined with dish data
  const weekStrings = weekStarts.map((d) => formatWeekStartDate(d));
  const { data: plans, error } = await db
    .from("meal_plans")
    .select(`week_start_date, servings, dish:dishes(name, category, calories, estimated_price_per_serving)`)
    .in("week_start_date", weekStrings)
    .not("dish_id", "is", null);

  if (error) return Response.json({ error: error.message }, { status: 500 });

  // Per-week aggregation
  const weekMap = new Map<
    string,
    { total_calories: number; total_cost: number; meal_count: number }
  >();
  for (const ws of weekStrings) {
    weekMap.set(ws, { total_calories: 0, total_cost: 0, meal_count: 0 });
  }

  // Cross-week aggregation
  const categoryCount = new Map<string, number>();
  const dishCount = new Map<string, { count: number; category: string }>();

  for (const plan of plans ?? []) {
    const dish = (plan.dish as unknown) as {
      name: string;
      category: string;
      calories: number | null;
      estimated_price_per_serving: number | null;
    } | null;
    if (!dish) continue;

    const weekKey = plan.week_start_date as string;
    const entry = weekMap.get(weekKey);
    if (!entry) continue;

    const servings = (plan.servings ?? 1) as number;
    entry.total_calories += (dish.calories ?? 0) * servings;
    entry.total_cost += (dish.estimated_price_per_serving ?? 0) * servings;
    entry.meal_count += 1;

    // Category breakdown (count dishes, not servings)
    const cat = dish.category || "その他";
    categoryCount.set(cat, (categoryCount.get(cat) ?? 0) + 1);

    // Top dishes
    const existing = dishCount.get(dish.name);
    if (existing) {
      existing.count += 1;
    } else {
      dishCount.set(dish.name, { count: 1, category: cat });
    }
  }

  // Build weeks array (chronological order: oldest first)
  const weeksData = weekStrings
    .slice()
    .reverse()
    .map((ws) => {
      const d = new Date(ws);
      const label = `${d.getMonth() + 1}/${d.getDate()}〜`;
      const entry = weekMap.get(ws)!;
      return {
        week_start: ws,
        label,
        total_calories: Math.round(entry.total_calories),
        total_cost: Math.round(entry.total_cost),
        meal_count: entry.meal_count,
        avg_calories_per_meal:
          entry.meal_count > 0
            ? Math.round(entry.total_calories / entry.meal_count)
            : 0,
      };
    });

  // Category breakdown sorted by count desc
  const category_breakdown = Array.from(categoryCount.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value }));

  // Top 5 dishes
  const top_dishes = Array.from(dishCount.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5)
    .map(([name, { count, category }]) => ({ name, count, category }));

  return Response.json({
    weeks: weeksData,
    category_breakdown,
    top_dishes,
  });
}
