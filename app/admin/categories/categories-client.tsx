"use client";

import { useState } from "react";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
}

export default function CategoriesClient({
  initialCategories,
}: {
  initialCategories: Category[];
}) {
  const [categories, setCategories] = useState(initialCategories);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Auto-generate slug from name
  function handleNameChange(value: string) {
    setName(value);
    setSlug(
      value
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
    );
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      // Use the browser supabase client to call service-role API indirectly
      // Categories CRUD goes through supabaseService on the server,
      // so we POST to a lightweight inline handler via fetch
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim(),
          description: description.trim() || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to add category");
        return;
      }

      const newCategory = await res.json();
      setCategories((prev) =>
        [...prev, newCategory].sort((a, b) => a.name.localeCompare(b.name))
      );
      setName("");
      setSlug("");
      setDescription("");
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggle(categoryId: string, currentActive: boolean) {
    setToggling(categoryId);
    try {
      const res = await fetch("/api/admin/categories", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category_id: categoryId,
          is_active: !currentActive,
        }),
      });

      if (res.ok) {
        setCategories((prev) =>
          prev.map((c) =>
            c.id === categoryId ? { ...c, is_active: !currentActive } : c
          )
        );
      }
    } finally {
      setToggling(null);
    }
  }

  return (
    <div className="space-y-8">
      {/* Add category form */}
      <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">
          Add New Category
        </h3>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-md">
            {error}
          </div>
        )}

        <form onSubmit={handleAdd} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                placeholder="e.g. Blog Posts"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Slug
              </label>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                placeholder="e.g. blog-posts"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Description (optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              placeholder="Short description of this category"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 text-sm font-medium bg-gray-900 text-white rounded-md hover:bg-gray-800 disabled:opacity-50 transition-colors cursor-pointer"
          >
            {submitting ? "Adding..." : "Add Category"}
          </button>
        </form>
      </div>

      {/* Categories list */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">
          All Categories ({categories.length})
        </h3>

        {categories.length === 0 ? (
          <p className="text-gray-500 text-sm">No categories yet.</p>
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-medium text-gray-700">
                    Name
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700">
                    Slug
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700">
                    Description
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700">
                    Status
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-gray-700">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {categories.map((cat) => (
                  <tr key={cat.id}>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {cat.name}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      <code className="bg-gray-50 px-1.5 py-0.5 rounded text-xs">
                        {cat.slug}
                      </code>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {cat.description || "--"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                          cat.is_active
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {cat.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleToggle(cat.id, cat.is_active)}
                        disabled={toggling !== null}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer disabled:opacity-50 ${
                          cat.is_active
                            ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            : "bg-green-600 text-white hover:bg-green-700"
                        }`}
                      >
                        {toggling === cat.id
                          ? "..."
                          : cat.is_active
                            ? "Deactivate"
                            : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
