"use client";

import { useState } from "react";

interface Dispute {
  id: string;
  reason: string;
  status: string;
  created_at: string;
  resolved_at: string | null;
  projects: {
    id: string;
    title: string;
    agreed_price_ngn: number;
  };
}

export default function DisputesClient({
  initialDisputes,
}: {
  initialDisputes: Dispute[];
}) {
  const [disputes, setDisputes] = useState(initialDisputes);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolution, setResolution] = useState<string>("resolved_writer");
  const [partialAmount, setPartialAmount] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleResolve(disputeId: string) {
    if (resolution === "resolved_partial" && !partialAmount) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/disputes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dispute_id: disputeId,
          resolution,
          resolution_amount_ngn:
            resolution === "resolved_partial"
              ? Number(partialAmount)
              : undefined,
          admin_notes: adminNotes || undefined,
        }),
      });

      if (res.ok) {
        setDisputes((prev) =>
          prev.map((d) =>
            d.id === disputeId
              ? { ...d, status: resolution, resolved_at: new Date().toISOString() }
              : d
          )
        );
        setResolvingId(null);
        setResolution("resolved_writer");
        setPartialAmount("");
        setAdminNotes("");
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (disputes.length === 0) {
    return <p className="text-gray-500 text-sm">No disputes to review.</p>;
  }

  return (
    <div className="space-y-4">
      {disputes.map((dispute) => (
        <div
          key={dispute.id}
          className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm"
        >
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-gray-900">
                {dispute.projects.title}
              </h3>
              <p className="text-sm text-gray-600 mt-1">{dispute.reason}</p>
            </div>
            <StatusBadge status={dispute.status} />
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 mb-3">
            <span>
              <span className="font-medium">Amount:</span>{" "}
              {"₦"}
              {dispute.projects.agreed_price_ngn.toLocaleString()}
            </span>
            <span>
              <span className="font-medium">Filed:</span>{" "}
              {new Date(dispute.created_at).toLocaleString()}
            </span>
            {dispute.resolved_at && (
              <span>
                <span className="font-medium">Resolved:</span>{" "}
                {new Date(dispute.resolved_at).toLocaleString()}
              </span>
            )}
          </div>

          {dispute.status === "open" && (
            <>
              {resolvingId === dispute.id ? (
                <div className="border-t border-gray-100 pt-4 mt-3 space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Resolution
                    </label>
                    <select
                      value={resolution}
                      onChange={(e) => setResolution(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                    >
                      <option value="resolved_writer">
                        Resolve for Writer (release escrow)
                      </option>
                      <option value="resolved_client">
                        Resolve for Client (refund)
                      </option>
                      <option value="resolved_partial">
                        Partial Resolution
                      </option>
                    </select>
                  </div>

                  {resolution === "resolved_partial" && (
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Amount to Writer ({"₦"})
                      </label>
                      <input
                        type="number"
                        min="1"
                        max={dispute.projects.agreed_price_ngn}
                        value={partialAmount}
                        onChange={(e) => setPartialAmount(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                        placeholder="Enter amount"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Admin Notes (optional)
                    </label>
                    <textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
                      placeholder="Notes about the resolution..."
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleResolve(dispute.id)}
                      disabled={submitting}
                      className="px-4 py-2 text-xs font-medium bg-gray-900 text-white rounded-md hover:bg-gray-800 disabled:opacity-50 transition-colors cursor-pointer"
                    >
                      {submitting ? "Submitting..." : "Submit Resolution"}
                    </button>
                    <button
                      onClick={() => setResolvingId(null)}
                      disabled={submitting}
                      className="px-4 py-2 text-xs font-medium bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setResolvingId(dispute.id)}
                  className="mt-2 px-4 py-2 text-xs font-medium bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors cursor-pointer"
                >
                  Resolve Dispute
                </button>
              )}
            </>
          )}
        </div>
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    open: "bg-yellow-100 text-yellow-800",
    resolved_writer: "bg-green-100 text-green-800",
    resolved_client: "bg-blue-100 text-blue-800",
    resolved_partial: "bg-purple-100 text-purple-800",
  };

  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${
        styles[status] || "bg-gray-100 text-gray-800"
      }`}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}
