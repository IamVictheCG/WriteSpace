import { requireRole } from "@/lib/access/require-role";
import { supabaseService } from "@/lib/supabase/service";
import { redirect } from "next/navigation";
import { AuthError } from "@/lib/access/require-role";
import BadgesClient from "./badges-client";

export default async function BadgesPage() {
  try {
    await requireRole("admin");
  } catch (err) {
    if (err instanceof AuthError) {
      redirect("/admin/login");
    }
    throw err;
  }

  const { data: applications } = await supabaseService
    .from("badge_applications")
    .select(
      "id, portfolio_notes, status, submitted_at, decided_at, writer_profiles!inner(id, username, full_name)"
    )
    .order("submitted_at", { ascending: false });

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Badge Applications
      </h2>
      <BadgesClient initialApplications={(applications || []) as any} />
    </div>
  );
}
