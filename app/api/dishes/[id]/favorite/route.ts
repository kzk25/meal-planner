export const runtime = 'edge';
import { createServerClient } from "@/lib/supabase-server";
import { NextRequest } from "next/server";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = createServerClient();

  const { data: dish } = await db
    .from("dishes")
    .select("is_favorite")
    .eq("id", id)
    .single();

  const newFav = !dish?.is_favorite;
  const { data, error } = await db
    .from("dishes")
    .update({
      is_favorite: newFav,
      favorited_at: newFav ? new Date().toISOString() : null,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}
