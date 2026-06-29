import { NextResponse } from "next/server";
import { supabaseService } from "@/lib/supabase/service";
import { requireRole, handleAuthError } from "@/lib/access/require-role";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100),
  description: z.string().max(500).nullable().optional(),
});

export async function POST(request: Request) {
  try {
    await requireRole("admin");
    const body = await request.json();
    const parsed = createSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed" }, { status: 400 });
    }

    const { data, error } = await supabaseService
      .from("categories")
      .insert({
        name: parsed.data.name,
        slug: parsed.data.slug,
        description: parsed.data.description || null,
        is_active: true,
      })
      .select("id, name, slug, description, is_active")
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "A category with that slug already exists" },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: "Failed to create category" },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    return handleAuthError(err);
  }
}

const toggleSchema = z.object({
  category_id: z.string().uuid(),
  is_active: z.boolean(),
});

export async function PATCH(request: Request) {
  try {
    await requireRole("admin");
    const body = await request.json();
    const parsed = toggleSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed" }, { status: 400 });
    }

    const { error } = await supabaseService
      .from("categories")
      .update({ is_active: parsed.data.is_active })
      .eq("id", parsed.data.category_id);

    if (error) {
      return NextResponse.json(
        { error: "Failed to update category" },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "Category updated" });
  } catch (err) {
    return handleAuthError(err);
  }
}
