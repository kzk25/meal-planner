export const runtime = 'edge';
import { createServerClient } from "@/lib/supabase-server";
import { NextRequest } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = createServerClient();

  const { data: dish, error: dishError } = await db
    .from("dishes")
    .select("*")
    .eq("id", id)
    .single();

  if (dishError) return Response.json({ error: dishError.message }, { status: 500 });
  if (!dish) return Response.json({ error: "Not found" }, { status: 404 });

  const { data: ingredients, error: ingError } = await db
    .from("ingredients")
    .select("*")
    .eq("dish_id", id)
    .order("id");

  if (ingError) return Response.json({ error: ingError.message }, { status: 500 });

  return Response.json({ ...dish, ingredients: ingredients ?? [] });
}
