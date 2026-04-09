import { createServerClient } from "@/lib/supabase-server";
import { NextRequest } from "next/server";

export async function GET() {
  const db = createServerClient();
  const { data, error } = await db
    .from("user_profile")
    .select("*")
    .eq("id", 1)
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const db = createServerClient();

  const { data, error } = await db
    .from("user_profile")
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq("id", 1)
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}
