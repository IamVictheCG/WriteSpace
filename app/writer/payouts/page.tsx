import { requireRole } from '@/lib/access/require-role'
import { supabaseService } from '@/lib/supabase/service'
import { WithdrawalForm } from './withdrawal-form'

export default async function WriterPayoutsPage() {
  const auth = await requireRole('writer')

  // Fetch wallet and payouts
  const [walletResult, payoutsResult] = await Promise.all([
    supabaseService
      .from('wallets')
      .select('balance_ngn, total_earned_ngn, total_withdrawn_ngn')
      .eq('writer_id', auth.profileId!)
      .single(),

    supabaseService
      .from('payouts')
      .select('id, amount_ngn, status, requested_at, processed_at')
      .eq('writer_id', auth.profileId!)
      .order('requested_at', { ascending: false }),
  ])

  const wallet = walletResult.data
  const payouts = payoutsResult.data ?? []

  const payoutStatusStyles: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    processing: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
    failed: 'bg-red-100 text-red-700',
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Payouts</h1>
        <p className="mt-1 text-sm text-gray-600">
          Manage your earnings and withdrawals
        </p>
      </div>

      {/* Wallet Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
          <p className="text-sm font-medium text-gray-500">Available Balance</p>
          <p className="mt-2 text-3xl font-bold text-green-700">
            {'₦'}{(wallet?.balance_ngn ?? 0).toLocaleString()}
          </p>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
          <p className="text-sm font-medium text-gray-500">Total Earned</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {'₦'}{(wallet?.total_earned_ngn ?? 0).toLocaleString()}
          </p>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
          <p className="text-sm font-medium text-gray-500">Total Withdrawn</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {'₦'}{(wallet?.total_withdrawn_ngn ?? 0).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Withdrawal Form */}
      <div className="mb-8 rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Request Withdrawal</h2>
        <WithdrawalForm balance={wallet?.balance_ngn ?? 0} />
      </div>

      {/* Payout History */}
      <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
        <div className="border-b px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Payout History</h2>
        </div>

        {payouts.length === 0 ? (
          <p className="p-6 text-sm text-gray-500">No payout history yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Amount</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Processed</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {payouts.map((payout) => (
                  <tr key={payout.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {new Date(payout.requested_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                      {'₦'}{payout.amount_ngn.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${payoutStatusStyles[payout.status] ?? 'bg-gray-100 text-gray-700'}`}>
                        {payout.status.charAt(0).toUpperCase() + payout.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {payout.processed_at
                        ? new Date(payout.processed_at).toLocaleDateString()
                        : '--'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
