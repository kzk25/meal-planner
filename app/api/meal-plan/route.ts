import { createServerClient } from "@/lib/supabase-server";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const week = searchParams.get("week");

  if (!week) {
    return Response.json({ error: "week parameter required" }, { status: 400 });
  }

  const db = createServerClient();
  const { data, error } = await db
    .from("meal_plans")
    .select(`*, dish:dishes(*)`)
    .eq("week_start_date", week)
    .order("day_of_week")
    .order("meal_type");

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { week_start_date, day_of_week, meal_type, dish_id, servings } = body;

  const db = createServerClient();
  const { data, error } = await db
    .from("meal_plans")
    .upsert(
      { week_start_date, day_of_week, meal_type, dish_id, servings: servings ?? 1 },
      { onConflict: "week_start_date,day_of_week,meal_type" }
    )
    .select(`*, dish:dishes(*)`)
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}
