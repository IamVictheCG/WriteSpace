"use client";

import { useState } from "react";

interface Flag {
  id: string;
  matched_pattern: string;
  status: string;
  created_at: string;
  messages: {
    id: string;
    content: string;
    sender_id: string;
    project_id: string;
  };
}

export default function FlagsClient({
  initialFlags,
}: {
  initialFlags: Flag[];
}) {
  const [flags, setFlags] = useState(initialFlags);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  async function handleAction(
    flagId: string,
    action: "released" | "edit_requested" | "escalated"
  ) {
    setActionLoading(`${flagId}-${action}`);
    try {
      const res = await fetch("/api/admin/flags", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flag_id: flagId, action }),
      });

      if (res.ok) {
        setFlags((prev) =>
          prev.map((f) => (f.id === flagId ? { ...f, status: action } : f))
        );
      }
    } finally {
      setActionLoading(null);
    }
  }

  if (flags.length === 0) {
    return (
      <p className="text-gray-500 text-sm">No flagged messages to review.</p>
    );
  }

  return (
    <div className="space-y-4">
      {flags.map((flag) => (
        <div
          key={flag.id}
          className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-900 mb-2">
                <span className="font-medium">Message:</span>{" "}
                {flag.messages.content.length > 200
                  ? flag.messages.content.slice(0, 200) + "..."
                  : flag.messages.content}
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                <span>
                  <span className="font-medium">Pattern:</span>{" "}
                  <code className="bg-red-50 text-red-700 px-1.5 py-0.5 rounded">
                    {flag.matched_pattern}
                  </code>
                </span>
                <span>
                  <span className="font-medium">Status:</span>{" "}
                  <StatusBadge status={flag.status} />
                </span>
                <span>
                  <span className="font-medium">Time:</span>{" "}
                  {new Date(flag.created_at).toLocaleString()}
                </span>
              </div>
            </div>

            {flag.status === "pending" && (
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => handleAction(flag.id, "released")}
                  disabled={actionLoading !== null}
                  className="px-3 py-1.5 text-xs font-medium bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {actionLoading === `${flag.id}-released`
                    ? "..."
                    : "Release"}
                </button>
                <button
                  onClick={() => handleAction(flag.id, "edit_requested")}
                  disabled={actionLoading !== null}
                  className="px-3 py-1.5 text-xs font-medium bg-yellow-500 text-white rounded-md hover:bg-yellow-600 disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {actionLoading === `${flag.id}-edit_requested`
                    ? "..."
                    : "Request Edit"}
                </button>
                <button
                  onClick={() => handleAction(flag.id, "escalated")}
                  disabled={actionLoading !== null}
                  className="px-3 py-1.5 text-xs font-medium bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {actionLoading === `${flag.id}-escalated`
                    ? "..."
                    : "Escalate"}
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
    released: "bg-green-100 text-green-800",
    edit_requested: "bg-orange-100 text-orange-800",
    escalated: "bg-red-100 text-red-800",
  };

  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
        styles[status] || "bg-gray-100 text-gray-800"
      }`}
    >
      {status.replace("_", " ")}
    </span>
  );
}
