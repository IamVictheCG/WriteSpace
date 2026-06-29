import { requireRole } from "@/lib/access/require-role";
import { supabaseService } from "@/lib/supabase/service";
import { redirect } from "next/navigation";
import { AuthError } from "@/lib/access/require-role";
import PayoutsClient from "./payouts-client";

export default async function PayoutsPage() {
  try {
    await requireRole("admin");
  } catch (err) {
    if (err instanceof AuthError) {
      redirect("/admin/login");
    }
    throw err;
  }

  const { data: payouts } = await supabaseService
    .from("payouts")
    .select(
      "id, amount_ngn, status, requested_at, processed_at, writer_profiles!inner(id, username, full_name, bank_name, bank_account_number, bank_account_name)"
    )
    .order("requested_at", { ascending: false });

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Payouts</h2>
      <PayoutsClient initialPayouts={(payouts || []) as any} />
    </div>
  );
}
