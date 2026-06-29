'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Category {
  id: string
  name: string
  slug: string
  description: string | null
}

interface FieldErrors {
  [key: string]: string[] | undefined
}

export default function WriterSignupPage() {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [success, setSuccess] = useState(false)

  const [form, setForm] = useState({
    email: '',
    password: '',
    username: '',
    full_name: '',
    bio: '',
    response_time_hours: '',
    price_range_min_ngn: '',
    price_range_max_ngn: '',
    bank_name: '',
    bank_account_number: '',
    bank_account_name: '',
    category_ids: [] as string[],
  })

  useEffect(() => {
    fetch('/api/categories')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setCategories(data)
      })
      .catch(() => {})
  }, [])

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
    // Clear field error on change
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  function toggleCategory(id: string) {
    setForm((prev) => ({
      ...prev,
      category_ids: prev.category_ids.includes(id)
        ? prev.category_ids.filter((c) => c !== id)
        : [...prev.category_ids, id],
    }))
    if (fieldErrors.category_ids) {
      setFieldErrors((prev) => {
        const next = { ...prev }
        delete next.category_ids
        return next
      })
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setFieldErrors({})
    setLoading(true)

    try {
      const res = await fetch('/api/writer/signup', {
        method: 'POST',
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
        if (data.details) {
          setFieldErrors(data.details)
        } else {
          setError(data.error || 'Signup failed')
        }
        return
      }

      setSuccess(true)
    } catch {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md rounded-xl bg-white p-8 text-center shadow-sm ring-1 ring-gray-200">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900">Account Created</h2>
          <p className="mt-2 text-sm text-gray-600">
            Please check your email to verify your account before signing in.
          </p>
          <Link
            href="/writer/login"
            className="mt-6 inline-block rounded-lg bg-green-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-green-700"
          >
            Go to Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">Writer Signup</h1>
          <p className="mt-2 text-sm text-gray-600">
            Create your writer account and start earning
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-xl bg-white p-8 shadow-sm ring-1 ring-gray-200"
        >
          {error && (
            <div className="mb-6 rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Account Details */}
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Account Details</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
              <input
                id="email"
                type="email"
                required
                value={form.email}
                onChange={(e) => updateField('email', e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              />
              {fieldErrors.email && <p className="mt-1 text-xs text-red-600">{fieldErrors.email[0]}</p>}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
              <input
                id="password"
                type="password"
                required
                value={form.password}
                onChange={(e) => updateField('password', e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              />
              {fieldErrors.password && <p className="mt-1 text-xs text-red-600">{fieldErrors.password[0]}</p>}
            </div>

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
              {fieldErrors.username && <p className="mt-1 text-xs text-red-600">{fieldErrors.username[0]}</p>}
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
              {fieldErrors.full_name && <p className="mt-1 text-xs text-red-600">{fieldErrors.full_name[0]}</p>}
            </div>
          </div>

          <div className="mt-4">
            <label htmlFor="bio" className="block text-sm font-medium text-gray-700">Bio (optional)</label>
            <textarea
              id="bio"
              rows={3}
              maxLength={500}
              value={form.bio}
              onChange={(e) => updateField('bio', e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              placeholder="Tell clients about yourself..."
            />
            <p className="mt-1 text-xs text-gray-500">{form.bio.length}/500</p>
            {fieldErrors.bio && <p className="mt-1 text-xs text-red-600">{fieldErrors.bio[0]}</p>}
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
              {fieldErrors.response_time_hours && <p className="mt-1 text-xs text-red-600">{fieldErrors.response_time_hours[0]}</p>}
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
                placeholder="e.g. 5000"
              />
              {fieldErrors.price_range_min_ngn && <p className="mt-1 text-xs text-red-600">{fieldErrors.price_range_min_ngn[0]}</p>}
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
                placeholder="e.g. 50000"
              />
              {fieldErrors.price_range_max_ngn && <p className="mt-1 text-xs text-red-600">{fieldErrors.price_range_max_ngn[0]}</p>}
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
              {fieldErrors.bank_name && <p className="mt-1 text-xs text-red-600">{fieldErrors.bank_name[0]}</p>}
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
              {fieldErrors.bank_account_number && <p className="mt-1 text-xs text-red-600">{fieldErrors.bank_account_number[0]}</p>}
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
              {fieldErrors.bank_account_name && <p className="mt-1 text-xs text-red-600">{fieldErrors.bank_account_name[0]}</p>}
            </div>
          </div>

          {/* Categories */}
          <h2 className="mb-4 mt-8 text-lg font-semibold text-gray-900">Writing Categories</h2>
          <p className="mb-3 text-sm text-gray-600">Select the categories you can write in. You&apos;ll receive job postings matching these categories.</p>
          {categories.length === 0 ? (
            <p className="text-sm text-gray-500">Loading categories...</p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((cat) => (
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
          )}
          {fieldErrors.category_ids && <p className="mt-1 text-xs text-red-600">{fieldErrors.category_ids[0]}</p>}

          {/* NDPR Disclosure */}
          <div className="mt-8 rounded-lg bg-gray-50 p-4 text-xs text-gray-600 ring-1 ring-gray-200">
            <p className="font-semibold text-gray-700">NDPR Compliance Disclosure</p>
            <p className="mt-1">
              By signing up, you acknowledge that messages exchanged through this platform may be monitored to ensure compliance with our terms of service, prevent fraud, and protect both writers and clients. Personal contact information shared in messages may be flagged and reviewed by administrators. Your data is processed in accordance with the Nigeria Data Protection Regulation (NDPR) and our Privacy Policy.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Create Writer Account'}
          </button>

          <p className="mt-4 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link href="/writer/login" className="font-medium text-green-600 hover:text-green-500">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
