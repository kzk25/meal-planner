export const runtime = 'edge';
import { createServerClient } from "@/lib/supabase-server";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const week = searchParams.get("week");

  if (!week) return Response.json({ error: "week required" }, { status: 400 });

  const db = createServerClient();
  const { data, error } = await db
    .from("shopping_items")
    .select("*")
    .eq("week_start_date", week)
    .order("category")
    .order("ingredient_name");

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const db = createServerClient();
  const { data, error } = await db
    .from("shopping_items")
    .insert(body)
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}
