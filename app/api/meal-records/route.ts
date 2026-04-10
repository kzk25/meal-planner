import { createServerClient } from "@/lib/supabase-server";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const month = searchParams.get("month");

  const db = createServerClient();
  let query = db.from("meal_records").select(`*, dish:dishes(*)`);

  if (date) {
    query = query.eq("recorded_date", date);
  } else if (month) {
    // Calculate the actual last day of the month
    const [y, m] = month.split("-").map(Number);
    const lastDay = new Date(y, m, 0).getDate(); // day 0 of next month = last day of this month
    query = query
      .gte("recorded_date", `${month}-01`)
      .lte("recorded_date", `${month}-${String(lastDay).padStart(2, "0")}`);
  }

  const { data, error } = await query.order("recorded_date", { ascending: false });
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const db = createServerClient();

  const { data, error } = await db
    .from("meal_records")
    .insert(body)
    .select(`*, dish:dishes(*)`)
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });

  // Update streak
  if (body.recorded_date) {
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/streak/update`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: body.recorded_date }),
    }).catch(() => {});
  }

  return Response.json(data);
}
