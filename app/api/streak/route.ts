import { createServerClient } from "@/lib/supabase-server";

export async function GET() {
  const db = createServerClient();
  const { data, error } = await db
    .from("streak_stats")
    .select("*")
    .eq("id", 1)
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data ?? { current_streak: 0, longest_streak: 0, total_recorded_days: 0 });
}
