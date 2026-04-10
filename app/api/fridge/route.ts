export const runtime = 'edge';
import { createServerClient } from "@/lib/supabase-server";
import { NextRequest } from "next/server";

export async function GET() {
  const db = createServerClient();
  const { data, error } = await db
    .from("fridge_items")
    .select("*")
    .eq("is_finished", false)
    .order("expiry_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const db = createServerClient();
  const { data, error } = await db
    .from("fridge_items")
    .insert(body)
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}
