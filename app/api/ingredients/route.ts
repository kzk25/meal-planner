export const runtime = 'edge';
import { createServerClient } from "@/lib/supabase-server";
import { NextRequest } from "next/server";

// POST: dish の食材を一括登録
// Body: array of { dish_id, name, amount?, unit?, estimated_price?, category? }
export async function POST(request: NextRequest) {
  const body = await request.json();
  const items = Array.isArray(body) ? body : [body];

  if (items.length === 0) {
    return Response.json({ error: "empty body" }, { status: 400 });
  }

  const db = createServerClient();
  const { data, error } = await db
    .from("ingredients")
    .insert(items)
    .select();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}
