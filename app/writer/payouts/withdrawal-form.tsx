'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function WithdrawalForm({ balance }: { balance: number }) {
  const router = useRouter()
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    const amountNum = Number(amount)
    if (amountNum <= 0) {
      setError('Please enter a valid amount')
      return
    }
    if (amountNum > balance) {
      setError('Insufficient balance')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/writer/payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount_ngn: amountNum }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Withdrawal request failed')
        return
      }

      setSuccess('Withdrawal requested successfully. It will be processed shortly.')
      setAmount('')
      router.refresh()
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}
      {success && (
        <div className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">{success}</div>
      )}

      <div className="flex items-end gap-4">
        <div className="flex-1">
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
            Amount (NGN)
          </label>
          <div className="relative mt-1">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
              {'₦'}
            </span>
            <input
              id="amount"
              type="number"
              required
              min={1}
              max={balance}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="block w-full rounded-lg border border-gray-300 py-2.5 pl-8 pr-3 text-sm shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              placeholder="Enter amount"
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Available: {'₦'}{balance.toLocaleString()}
          </p>
        </div>

        <button
          type="submit"
          disabled={loading || balance <= 0}
          className="rounded-lg bg-green-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Processing...' : 'Withdraw'}
        </button>
      </div>
    </form>
  )
}
