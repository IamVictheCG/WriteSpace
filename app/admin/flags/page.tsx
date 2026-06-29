import { requireRole } from "@/lib/access/require-role";
import { supabaseService } from "@/lib/supabase/service";
import { redirect } from "next/navigation";
import { AuthError } from "@/lib/access/require-role";
import FlagsClient from "./flags-client";

export default async function FlagsPage() {
  try {
    await requireRole("admin");
  } catch (err) {
    if (err instanceof AuthError) {
      redirect("/admin/login");
    }
    throw err;
  }

  const { data: flags } = await supabaseService
    .from("message_flags")
    .select(
      "id, matched_pattern, status, created_at, messages!inner(id, content, sender_id, project_id)"
    )
    .order("created_at", { ascending: false });

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Flagged Messages</h2>
      <FlagsClient initialFlags={(flags || []) as any} />
    </div>
  );
}
