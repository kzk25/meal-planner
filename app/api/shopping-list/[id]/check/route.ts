import { createServerClient } from "@/lib/supabase-server";
import { NextRequest } from "next/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { is_purchased } = await request.json();
  const db = createServerClient();

  const { data, error } = await db
    .from("shopping_items")
    .update({
      is_purchased,
      purchased_at: is_purchased ? new Date().toISOString() : null,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });

  // If purchased, optionally add to fridge
  if (is_purchased && data.add_to_fridge) {
    await db.from("fridge_items").insert({
      name: data.ingredient_name,
      amount: data.total_amount,
      unit: data.unit,
      category: data.category,
      added_from: "shopping_list",
    });
  }

  return Response.json(data);
}
