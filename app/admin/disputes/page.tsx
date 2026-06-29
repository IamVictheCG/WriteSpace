import { requireRole } from "@/lib/access/require-role";
import { supabaseService } from "@/lib/supabase/service";
import { redirect } from "next/navigation";
import { AuthError } from "@/lib/access/require-role";
import DisputesClient from "./disputes-client";

export default async function DisputesPage() {
  try {
    await requireRole("admin");
  } catch (err) {
    if (err instanceof AuthError) {
      redirect("/admin/login");
    }
    throw err;
  }

  const { data: disputes } = await supabaseService
    .from("disputes")
    .select(
      "id, reason, status, created_at, resolved_at, projects!inner(id, title, agreed_price_ngn)"
    )
    .order("created_at", { ascending: false });

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Disputes</h2>
      <DisputesClient initialDisputes={(disputes || []) as any} />
    </div>
  );
}
