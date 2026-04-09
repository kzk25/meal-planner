import { createServerClient } from "@/lib/supabase-server";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const week = searchParams.get("week");

  if (!week) return Response.json({ error: "week required" }, { status: 400 });

  const db = createServerClient();

  // Get meal plans for the week with dish nutrition data
  const { data: plans, error } = await db
    .from("meal_plans")
    .select(`servings, dish:dishes(calories, protein, fat, carbs, fiber, salt)`)
    .eq("week_start_date", week);

  if (error) return Response.json({ error: error.message }, { status: 500 });

  let totalCalories = 0, totalProtein = 0, totalFat = 0, totalCarbs = 0, totalFiber = 0, totalSalt = 0;
  let daysWithData = 0;
  const daySet = new Set<string>();

  for (const plan of plans ?? []) {
    const dish = plan.dish as { calories?: number; protein?: number; fat?: number; carbs?: number; fiber?: number; salt?: number } | null;
    if (!dish) continue;
    const s = (plan.servings ?? 1);
    totalCalories += (dish.calories ?? 0) * s;
    totalProtein += (dish.protein ?? 0) * s;
    totalFat += (dish.fat ?? 0) * s;
    totalCarbs += (dish.carbs ?? 0) * s;
    totalFiber += (dish.fiber ?? 0) * s;
    totalSalt += (dish.salt ?? 0) * s;
  }

  daysWithData = daySet.size || 7;

  return Response.json({
    total_calories: Math.round(totalCalories),
    avg_calories: Math.round(totalCalories / 7),
    total_protein: Math.round(totalProtein * 10) / 10,
    total_fat: Math.round(totalFat * 10) / 10,
    total_carbs: Math.round(totalCarbs * 10) / 10,
    total_fiber: Math.round(totalFiber * 10) / 10,
    total_salt: Math.round(totalSalt * 10) / 10,
    days_with_data: daysWithData,
  });
}
