export const runtime = 'edge';
import { createServerClient } from "@/lib/supabase-server";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const week = searchParams.get("week");

  if (!week) {
    return Response.json({ error: "week parameter required" }, { status: 400 });
  }

  const db = createServerClient();

  // 1. Check if score already exists and is calculated
  const { data: existing } = await db
    .from("weekly_scores")
    .select("*")
    .eq("week_start_date", week)
    .single();

  if (existing && existing.total_score !== null) {
    return Response.json(existing);
  }

  // 2. Fetch meal plans with dish data
  const { data: plans, error: plansError } = await db
    .from("meal_plans")
    .select(`*, dish:dishes(*)`)
    .eq("week_start_date", week);

  if (plansError) {
    return Response.json({ error: plansError.message }, { status: 500 });
  }

  // 3. Fetch user profile for budget
  const { data: profile } = await db
    .from("user_profile")
    .select("meal_budget_per_day")
    .eq("id", 1)
    .single();

  const mealBudgetPerDay = profile?.meal_budget_per_day ?? 500;
  const weeklyBudget = mealBudgetPerDay * 7;

  // 4. Calculate scores
  const activePlans = (plans ?? []).filter((p) => p.dish_id && p.dish);
  const mealCount = activePlans.length;

  // Accumulate nutrition and cost
  let totalCalories = 0;
  let totalProtein = 0;
  let totalFat = 0;
  let totalCarbs = 0;
  let totalCost = 0;
  const dishIds = new Set<number>();

  for (const plan of activePlans) {
    const dish = plan.dish as {
      calories?: number | null;
      protein?: number | null;
      fat?: number | null;
      carbs?: number | null;
      estimated_price_per_serving?: number | null;
    } | null;
    if (!dish) continue;
    const s = plan.servings ?? 1;
    totalCalories += (dish.calories ?? 0) * s;
    totalProtein += (dish.protein ?? 0) * s;
    totalFat += (dish.fat ?? 0) * s;
    totalCarbs += (dish.carbs ?? 0) * s;
    totalCost += (dish.estimated_price_per_serving ?? 0) * s;
    if (plan.dish_id) dishIds.add(plan.dish_id);
  }

  const avgCaloriesPerDay = mealCount > 0 ? totalCalories / 7 : 0;

  // calorie_score (0-25): Target 2000 kcal/day. ±200 = full, ±600 = 0
  let calorieScore = 0;
  if (mealCount > 0) {
    const diff = Math.abs(avgCaloriesPerDay - 2000);
    if (diff <= 200) {
      calorieScore = 25;
    } else if (diff < 600) {
      calorieScore = Math.round(25 * (1 - (diff - 200) / 400));
    } else {
      calorieScore = 0;
    }
  }

  // pfc_score (0-25): Target P:15%, F:25%, C:60%
  let pfcScore = 0;
  if (mealCount > 0 && totalCalories > 0) {
    const totalMacroCalories = totalProtein * 4 + totalFat * 9 + totalCarbs * 4;
    if (totalMacroCalories > 0) {
      const actualP = (totalProtein * 4) / totalMacroCalories;
      const actualF = (totalFat * 9) / totalMacroCalories;
      const actualC = (totalCarbs * 4) / totalMacroCalories;
      // Calculate deviation from target ratios
      const pDiff = Math.abs(actualP - 0.15);
      const fDiff = Math.abs(actualF - 0.25);
      const cDiff = Math.abs(actualC - 0.60);
      // Max tolerated deviation is 0.15 per macro
      const totalDiff = (pDiff + fDiff + cDiff) / 3;
      const maxDiff = 0.15;
      pfcScore = Math.round(Math.max(0, 25 * (1 - totalDiff / maxDiff)));
    }
  }

  // variety_score (0-25): unique dishes / 21 * 25
  const uniqueDishCount = dishIds.size;
  const varietyScore = Math.min(25, Math.round((uniqueDishCount / 21) * 25));

  // budget_score (0-25): under budget = 25, 50% over = 0
  let budgetScore = 0;
  if (mealCount > 0) {
    if (totalCost <= weeklyBudget) {
      budgetScore = 25;
    } else {
      const overRatio = (totalCost - weeklyBudget) / weeklyBudget;
      if (overRatio >= 0.5) {
        budgetScore = 0;
      } else {
        budgetScore = Math.round(25 * (1 - overRatio / 0.5));
      }
    }
  }

  const totalScore = calorieScore + pfcScore + varietyScore + budgetScore;
  const avgCalories = Math.round(avgCaloriesPerDay);

  // 5. Upsert into weekly_scores
  const scoreData = {
    week_start_date: week,
    total_score: totalScore,
    calorie_score: calorieScore,
    pfc_score: pfcScore,
    variety_score: varietyScore,
    budget_score: budgetScore,
  };

  await db
    .from("weekly_scores")
    .upsert(scoreData, { onConflict: "week_start_date" });

  return Response.json({
    week_start_date: week,
    total_score: totalScore,
    calorie_score: calorieScore,
    pfc_score: pfcScore,
    variety_score: varietyScore,
    budget_score: budgetScore,
    meal_count: mealCount,
    avg_calories: avgCalories,
    total_cost: Math.round(totalCost),
  });
}
