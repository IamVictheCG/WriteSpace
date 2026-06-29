'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Profile {
  id: string
  username: string
  full_name: string
  bio: string | null
  response_time_hours: number
  price_range_min_ngn: number
  price_range_max_ngn: number
  bank_name: string
  bank_account_number: string
  bank_account_name: string
  is_verified: boolean
}

interface Category {
  id: string
  name: string
  slug: string
}

export function AccountForm({
  profile,
  allCategories,
  writerCategoryIds,
}: {
  profile: Profile
  allCategories: Category[]
  writerCategoryIds: string[]
}) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [applyingBadge, setApplyingBadge] = useState(false)

  const [form, setForm] = useState({
    username: profile.username,
    full_name: profile.full_name,
    bio: profile.bio ?? '',
    response_time_hours: String(profile.response_time_hours),
    price_range_min_ngn: String(profile.price_range_min_ngn),
    price_range_max_ngn: String(profile.price_range_max_ngn),
    bank_name: profile.bank_name,
    bank_account_number: profile.bank_account_number,
    bank_account_name: profile.bank_account_name,
    category_ids: [...writerCategoryIds],
  })

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function toggleCategory(id: string) {
    setForm((prev) => ({
      ...prev,
      category_ids: prev.category_ids.includes(id)
        ? prev.category_ids.filter((c) => c !== id)
        : [...prev.category_ids, id],
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setSaving(true)

    try {
      const res = await fetch('/api/writer/account', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          response_time_hours: Number(form.response_time_hours),
          price_range_min_ngn: Number(form.price_range_min_ngn),
          price_range_max_ngn: Number(form.price_range_max_ngn),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to update profile')
        return
      }

      setSuccess('Profile updated successfully')
      router.refresh()
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setSaving(false)
    }
  }

  async function handleApplyVerification() {
    setApplyingBadge(true)
    setError(null)

    try {
      const res = await fetch('/api/writer/verification', {
        method: 'POST',
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to submit verification request')
        return
      }

      setSuccess('Verification request submitted. You will be notified when reviewed.')
      router.refresh()
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setApplyingBadge(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Verified Badge */}
      {!profile.is_verified && (
        <div className="rounded-xl bg-blue-50 p-6 ring-1 ring-blue-200">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-blue-900">Get Verified</h2>
              <p className="mt-1 text-sm text-blue-700">
                Verified writers receive a badge on their profile, giving clients more confidence in your work. Apply for verification once you have completed at least 3 projects with good ratings.
              </p>
            </div>
            <button
              onClick={handleApplyVerification}
              disabled={applyingBadge}
              className="shrink-0 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {applyingBadge ? 'Applying...' : 'Apply Now'}
            </button>
          </div>
        </div>
      )}

      {profile.is_verified && (
        <div className="rounded-xl bg-green-50 p-6 ring-1 ring-green-200">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-semibold text-green-800">Verified Writer</span>
          </div>
        </div>
      )}

      {/* Profile Form */}
      <form onSubmit={handleSubmit} className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
        {error && (
          <div className="mb-6 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
        )}
        {success && (
          <div className="mb-6 rounded-lg bg-green-50 p-3 text-sm text-green-700">{success}</div>
        )}

        {/* Profile Details */}
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Profile Details</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">Username</label>
            <input
              id="username"
              type="text"
              required
              value={form.username}
              onChange={(e) => updateField('username', e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>

          <div>
            <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">Full Name</label>
            <input
              id="full_name"
              type="text"
              required
              value={form.full_name}
              onChange={(e) => updateField('full_name', e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>
        </div>

        <div className="mt-4">
          <label htmlFor="bio" className="block text-sm font-medium text-gray-700">Bio</label>
          <textarea
            id="bio"
            rows={3}
            maxLength={500}
            value={form.bio}
            onChange={(e) => updateField('bio', e.target.value)}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
          />
          <p className="mt-1 text-xs text-gray-500">{form.bio.length}/500</p>
        </div>

        {/* Work Preferences */}
        <h2 className="mb-4 mt-8 text-lg font-semibold text-gray-900">Work Preferences</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="response_time_hours" className="block text-sm font-medium text-gray-700">
              Response Time (hours)
            </label>
            <input
              id="response_time_hours"
              type="number"
              required
              min={1}
              max={48}
              value={form.response_time_hours}
              onChange={(e) => updateField('response_time_hours', e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>

          <div>
            <label htmlFor="price_range_min_ngn" className="block text-sm font-medium text-gray-700">
              Min Price (NGN)
            </label>
            <input
              id="price_range_min_ngn"
              type="number"
              required
              min={1}
              value={form.price_range_min_ngn}
              onChange={(e) => updateField('price_range_min_ngn', e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>

          <div>
            <label htmlFor="price_range_max_ngn" className="block text-sm font-medium text-gray-700">
              Max Price (NGN)
            </label>
            <input
              id="price_range_max_ngn"
              type="number"
              required
              min={1}
              value={form.price_range_max_ngn}
              onChange={(e) => updateField('price_range_max_ngn', e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>
        </div>

        {/* Bank Details */}
        <h2 className="mb-4 mt-8 text-lg font-semibold text-gray-900">Bank Details</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="bank_name" className="block text-sm font-medium text-gray-700">Bank Name</label>
            <input
              id="bank_name"
              type="text"
              required
              value={form.bank_name}
              onChange={(e) => updateField('bank_name', e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>

          <div>
            <label htmlFor="bank_account_number" className="block text-sm font-medium text-gray-700">Account Number</label>
            <input
              id="bank_account_number"
              type="text"
              required
              maxLength={10}
              value={form.bank_account_number}
              onChange={(e) => updateField('bank_account_number', e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>

          <div>
            <label htmlFor="bank_account_name" className="block text-sm font-medium text-gray-700">Account Name</label>
            <input
              id="bank_account_name"
              type="text"
              required
              value={form.bank_account_name}
              onChange={(e) => updateField('bank_account_name', e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>
        </div>

        {/* Categories */}
        <h2 className="mb-4 mt-8 text-lg font-semibold text-gray-900">Writing Categories</h2>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {allCategories.map((cat) => (
            <label
              key={cat.id}
              className={`flex cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm transition-colors ${
                form.category_ids.includes(cat.id)
                  ? 'border-green-500 bg-green-50 text-green-800'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <input
                type="checkbox"
                checked={form.category_ids.includes(cat.id)}
                onChange={() => toggleCategory(cat.id)}
                className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              {cat.name}
            </label>
          ))}
        </div>

        <button
          type="submit"
          disabled={saving}
          className="mt-8 rounded-lg bg-green-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  )
}
