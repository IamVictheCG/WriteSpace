"use client";

import { useState } from "react";

interface Payout {
  id: string;
  amount_ngn: number;
  status: string;
  requested_at: string;
  processed_at: string | null;
  writer_profiles: {
    id: string;
    username: string;
    full_name: string;
    bank_name: string | null;
    bank_account_number: string | null;
    bank_account_name: string | null;
  };
}

export default function PayoutsClient({
  initialPayouts,
}: {
  initialPayouts: Payout[];
}) {
  const [payouts, setPayouts] = useState(initialPayouts);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  async function handleStatusUpdate(
    payoutId: string,
    newStatus: "processed" | "completed"
  ) {
    setActionLoading(`${payoutId}-${newStatus}`);
    try {
      const res = await fetch("/api/admin/payouts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payout_id: payoutId, status: newStatus }),
      });

      if (res.ok) {
        setPayouts((prev) =>
          prev.map((p) =>
            p.id === payoutId
              ? {
                  ...p,
                  status: newStatus,
                  processed_at: new Date().toISOString(),
                }
              : p
          )
        );
      }
    } finally {
      setActionLoading(null);
    }
  }

  const pendingPayouts = payouts.filter((p) => p.status === "pending");
  const processedPayouts = payouts.filter((p) => p.status === "processed");
  const completedPayouts = payouts.filter((p) => p.status === "completed");

  return (
    <div className="space-y-8">
      {/* Summary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Pending
          </p>
          <p className="text-2xl font-bold text-yellow-600 mt-1">
            {pendingPayouts.length}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {"₦"}
            {pendingPayouts
              .reduce((sum, p) => sum + p.amount_ngn, 0)
              .toLocaleString()}
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Processed
          </p>
          <p className="text-2xl font-bold text-blue-600 mt-1">
            {processedPayouts.length}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {"₦"}
            {processedPayouts
              .reduce((sum, p) => sum + p.amount_ngn, 0)
              .toLocaleString()}
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Completed
          </p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            {completedPayouts.length}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {"₦"}
            {completedPayouts
              .reduce((sum, p) => sum + p.amount_ngn, 0)
              .toLocaleString()}
          </p>
        </div>
      </div>

      {/* Payouts table */}
      {payouts.length === 0 ? (
        <p className="text-gray-500 text-sm">No payouts to display.</p>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-medium text-gray-700">
                  Writer
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">
                  Amount
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">
                  Bank Details
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">
                  Status
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">
                  Requested
                </th>
                <th className="text-right px-4 py-3 font-medium text-gray-700">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {payouts.map((payout) => (
                <tr key={payout.id}>
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-900">
                        {payout.writer_profiles.full_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        @{payout.writer_profiles.username}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {"₦"}{payout.amount_ngn.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {payout.writer_profiles.bank_name ? (
                      <div>
                        <p>{payout.writer_profiles.bank_name}</p>
                        <p>{payout.writer_profiles.bank_account_number}</p>
                        <p>{payout.writer_profiles.bank_account_name}</p>
                      </div>
                    ) : (
                      <span className="text-gray-400">Not provided</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={payout.status} />
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {new Date(payout.requested_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      {payout.status === "pending" && (
                        <button
                          onClick={() =>
                            handleStatusUpdate(payout.id, "processed")
                          }
                          disabled={actionLoading !== null}
                          className="px-3 py-1 text-xs font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors cursor-pointer"
                        >
                          {actionLoading === `${payout.id}-processed`
                            ? "..."
                            : "Mark Processed"}
                        </button>
                      )}
                      {(payout.status === "pending" ||
                        payout.status === "processed") && (
                        <button
                          onClick={() =>
                            handleStatusUpdate(payout.id, "completed")
                          }
                          disabled={actionLoading !== null}
                          className="px-3 py-1 text-xs font-medium bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors cursor-pointer"
                        >
                          {actionLoading === `${payout.id}-completed`
                            ? "..."
                            : "Mark Completed"}
                        </button>
                      )}
                      {payout.status === "completed" && (
                        <span className="text-xs text-gray-400">Done</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    processed: "bg-blue-100 text-blue-800",
    completed: "bg-green-100 text-green-800",
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
