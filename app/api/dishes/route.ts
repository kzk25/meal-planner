export const runtime = 'edge';
import { createServerClient } from "@/lib/supabase-server";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search");
  const favorite = searchParams.get("favorite");

  const db = createServerClient();
  let query = db.from("dishes").select("*");

  if (search) query = query.ilike("name", `%${search}%`);
  if (favorite === "true") query = query.eq("is_favorite", true);

  const { data, error } = await query.order("name");
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const db = createServerClient();

  const { data, error } = await db
    .from("dishes")
    .insert(body)
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}
