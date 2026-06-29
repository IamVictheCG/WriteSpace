"use client";

import { useState } from "react";

interface BadgeApplication {
  id: string;
  portfolio_notes: string;
  status: string;
  submitted_at: string;
  decided_at: string | null;
  writer_profiles: {
    id: string;
    username: string;
    full_name: string;
  };
}

export default function BadgesClient({
  initialApplications,
}: {
  initialApplications: BadgeApplication[];
}) {
  const [applications, setApplications] = useState(initialApplications);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  async function handleAction(
    applicationId: string,
    action: "approved" | "rejected"
  ) {
    setActionLoading(`${applicationId}-${action}`);
    try {
      const res = await fetch("/api/admin/badges", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ application_id: applicationId, action }),
      });

      if (res.ok) {
        setApplications((prev) =>
          prev.map((a) =>
            a.id === applicationId
              ? { ...a, status: action, decided_at: new Date().toISOString() }
              : a
          )
        );
      }
    } finally {
      setActionLoading(null);
    }
  }

  if (applications.length === 0) {
    return (
      <p className="text-gray-500 text-sm">No badge applications to review.</p>
    );
  }

  return (
    <div className="space-y-4">
      {applications.map((app) => (
        <div
          key={app.id}
          className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-sm font-semibold text-gray-900">
                  {app.writer_profiles.full_name}
                </h3>
                <span className="text-xs text-gray-500">
                  @{app.writer_profiles.username}
                </span>
                <StatusBadge status={app.status} />
              </div>
              <p className="text-sm text-gray-600 mb-2">
                {app.portfolio_notes}
              </p>
              <div className="flex gap-x-4 text-xs text-gray-500">
                <span>
                  <span className="font-medium">Submitted:</span>{" "}
                  {new Date(app.submitted_at).toLocaleString()}
                </span>
                {app.decided_at && (
                  <span>
                    <span className="font-medium">Decided:</span>{" "}
                    {new Date(app.decided_at).toLocaleString()}
                  </span>
                )}
              </div>
            </div>

            {app.status === "pending" && (
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => handleAction(app.id, "approved")}
                  disabled={actionLoading !== null}
                  className="px-3 py-1.5 text-xs font-medium bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {actionLoading === `${app.id}-approved`
                    ? "..."
                    : "Approve"}
                </button>
                <button
                  onClick={() => handleAction(app.id, "rejected")}
                  disabled={actionLoading !== null}
                  className="px-3 py-1.5 text-xs font-medium bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {actionLoading === `${app.id}-rejected`
                    ? "..."
                    : "Reject"}
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    approved: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
  };

  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
        styles[status] || "bg-gray-100 text-gray-800"
      }`}
    >
      {status}
    </span>
  );
}
