export const runtime = 'edge';
import { createServerClient } from "@/lib/supabase-server";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const { date } = await request.json();
  const db = createServerClient();

  // Count meals for the date
  const { count } = await db
    .from("meal_records")
    .select("*", { count: "exact", head: true })
    .eq("recorded_date", date);

  const mealCount = count ?? 0;

  // Get user's min meals setting
  const { data: profile } = await db
    .from("user_profile")
    .select("streak_min_meals_per_day")
    .eq("id", 1)
    .single();

  const minMeals = profile?.streak_min_meals_per_day ?? 1;

  if (mealCount < minMeals) {
    return Response.json({ updated: false });
  }

  // Upsert streak_log
  await db.from("streak_log").upsert(
    { date, meal_count: mealCount, is_counted: true },
    { onConflict: "date" }
  );

  // Update streak_stats
  const { data: stats } = await db
    .from("streak_stats")
    .select("*")
    .eq("id", 1)
    .single();

  const today = new Date(date);
  const lastDate = stats?.last_recorded_date ? new Date(stats.last_recorded_date) : null;

  let currentStreak = stats?.current_streak ?? 0;
  let longestStreak = stats?.longest_streak ?? 0;
  let totalDays = stats?.total_recorded_days ?? 0;

  if (!lastDate) {
    currentStreak = 1;
    totalDays = 1;
  } else {
    const dayDiff = Math.floor((today.getTime() - lastDate.getTime()) / 86400000);
    if (dayDiff === 1) {
      currentStreak += 1;
      totalDays += 1;
    } else if (dayDiff === 0) {
      // Same day, no change
    } else {
      currentStreak = 1;
      totalDays += 1;
    }
  }

  if (currentStreak > longestStreak) longestStreak = currentStreak;

  await db.from("streak_stats").upsert({
    id: 1,
    current_streak: currentStreak,
    longest_streak: longestStreak,
    last_recorded_date: date,
    total_recorded_days: totalDays,
    updated_at: new Date().toISOString(),
  });

  return Response.json({ updated: true, current_streak: currentStreak });
}
