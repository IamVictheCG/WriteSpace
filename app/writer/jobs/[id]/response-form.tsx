'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function JobResponseForm({ jobId, budget }: { jobId: string; budget: number }) {
  const router = useRouter()
  const [pitchText, setPitchText] = useState('')
  const [proposedPrice, setProposedPrice] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await fetch('/api/writer/jobs/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_id: jobId,
          pitch_text: pitchText,
          proposed_price_ngn: Number(proposedPrice),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to submit response')
        return
      }

      router.refresh()
    } catch {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label htmlFor="pitch_text" className="block text-sm font-medium text-gray-700">
            Your Pitch
          </label>
          <textarea
            id="pitch_text"
            required
            rows={5}
            minLength={10}
            maxLength={2000}
            value={pitchText}
            onChange={(e) => setPitchText(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            placeholder="Explain why you're the best fit for this job, your relevant experience, and how you'd approach it..."
          />
          <p className="mt-1 text-xs text-gray-500">{pitchText.length}/2000</p>
        </div>

        <div>
          <label htmlFor="proposed_price" className="block text-sm font-medium text-gray-700">
            Proposed Price (NGN)
          </label>
          <div className="relative mt-1">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
              {'₦'}
            </span>
            <input
              id="proposed_price"
              type="number"
              required
              min={1}
              value={proposedPrice}
              onChange={(e) => setProposedPrice(e.target.value)}
              className="block w-full rounded-lg border border-gray-300 py-2.5 pl-8 pr-3 text-sm shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              placeholder="Enter your price"
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Client budget: {'₦'}{budget.toLocaleString()}
          </p>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="mt-6 w-full rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? 'Submitting...' : 'Submit Response'}
      </button>
    </form>
  )
}
