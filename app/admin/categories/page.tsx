import { requireRole } from "@/lib/access/require-role";
import { supabaseService } from "@/lib/supabase/service";
import { redirect } from "next/navigation";
import { AuthError } from "@/lib/access/require-role";
import CategoriesClient from "./categories-client";

export default async function CategoriesPage() {
  try {
    await requireRole("admin");
  } catch (err) {
    if (err instanceof AuthError) {
      redirect("/admin/login");
    }
    throw err;
  }

  const { data: categories } = await supabaseService
    .from("categories")
    .select("id, name, slug, description, is_active")
    .order("name");

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Categories</h2>
      <CategoriesClient initialCategories={categories || []} />
    </div>
  );
}
