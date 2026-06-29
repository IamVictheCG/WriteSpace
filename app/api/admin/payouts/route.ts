import { NextResponse } from "next/server";
import { supabaseService } from "@/lib/supabase/service";
import { requireRole, handleAuthError } from "@/lib/access/require-role";
import { z } from "zod";

export async function GET() {
  try {
    await requireRole("admin");

    const { data: payouts } = await supabaseService
      .from("payouts")
      .select(
        "id, amount_ngn, status, requested_at, processed_at, writer_profiles!inner(id, username, full_name, bank_name, bank_account_number, bank_account_name)"
      )
      .order("requested_at", { ascending: false });

    return NextResponse.json(payouts || []);
  } catch (err) {
    return handleAuthError(err);
  }
}

const updateSchema = z.object({
  payout_id: z.string().uuid(),
  status: z.enum(["processed", "completed"]),
});

export async function PATCH(request: Request) {
  try {
    await requireRole("admin");
    const body = await request.json();
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed" }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {
      status: parsed.data.status,
    };

    if (parsed.data.status === "processed" || parsed.data.status === "completed") {
      updateData.processed_at = new Date().toISOString();
    }

    const { error } = await supabaseService
      .from("payouts")
      .update(updateData)
      .eq("id", parsed.data.payout_id);

    if (error) {
      return NextResponse.json(
        { error: "Failed to update payout" },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "Payout updated" });
  } catch (err) {
    return handleAuthError(err);
  }
}
