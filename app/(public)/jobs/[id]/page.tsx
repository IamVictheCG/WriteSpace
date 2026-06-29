import Link from 'next/link'
import { notFound } from 'next/navigation'
import { supabaseService } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'

export default async function JobDetailPage(
  props: PageProps<'/jobs/[id]'>
) {
  const { id } = await props.params

  // Fetch job posting with category info
  const { data: job } = await supabaseService
    .from('job_postings')
    .select(
      `
      id,
      title,
      description,
      budget_ngn,
      status,
      response_count,
      max_responses,
      response_deadline,
      created_at,
      categories!inner (
        id, name, slug
      )
    `
    )
    .eq('id', id)
    .single()

  if (!job) notFound()

  const category = (job as any).categories
  const deadline = new Date(job.response_deadline)
  const now = new Date()
  const isExpired = deadline < now
  const isOpen = job.status === 'open' && !isExpired

  // Calculate time remaining
  const timeRemaining = getTimeRemaining(deadline)

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-gray-500">
        <Link href="/categories" className="hover:text-gray-700">
          Categories
        </Link>
        <span className="mx-2">/</span>
        {category && (
          <>
            <Link
              href={`/categories/${category.slug}`}
              className="hover:text-gray-700"
            >
              {category.name}
            </Link>
            <span className="mx-2">/</span>
          </>
        )}
        <span className="text-gray-900 truncate">Job Posting</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-gray-200 p-8">
            {/* Status badge */}
            <div className="flex items-center gap-3 mb-4">
              <StatusBadge status={job.status} isExpired={isExpired} />
              {category && (
                <Link
                  href={`/categories/${category.slug}`}
                  className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-600 hover:bg-gray-200 transition-colors"
                >
                  {category.name}
                </Link>
              )}
            </div>

            <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>

            <p className="mt-1 text-sm text-gray-400">
              Posted{' '}
              {new Date(job.created_at).toLocaleDateString('en-NG', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>

            <div className="mt-6">
              <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
                Description
              </h2>
              <div className="mt-3 text-gray-700 whitespace-pre-line leading-relaxed">
                {job.description}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div>
          <div className="rounded-xl border border-gray-200 p-6 sticky top-24">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Job Details
            </h2>

            <dl className="space-y-4">
              {job.budget_ngn !== null && (
                <div>
                  <dt className="text-sm text-gray-500">Budget</dt>
                  <dd className="mt-1 text-xl font-bold text-green-700">
                    {formatPrice(job.budget_ngn)}
                  </dd>
                </div>
              )}

              <div>
                <dt className="text-sm text-gray-500">Status</dt>
                <dd className="mt-1">
                  <StatusBadge status={job.status} isExpired={isExpired} />
                </dd>
              </div>

              {isOpen && (
                <div>
                  <dt className="text-sm text-gray-500">Time Remaining</dt>
                  <dd className="mt-1 text-sm font-medium text-gray-900">
                    {timeRemaining}
                  </dd>
                </div>
              )}

              {isExpired && job.status === 'open' && (
                <div>
                  <dt className="text-sm text-gray-500">Deadline</dt>
                  <dd className="mt-1 text-sm font-medium text-red-600">
                    Expired
                  </dd>
                </div>
              )}

              {isOpen && (
                <div>
                  <dt className="text-sm text-gray-500">Responses</dt>
                  <dd className="mt-1">
                    <span className="text-lg font-semibold text-gray-900">
                      {job.response_count}
                    </span>
                    <span className="text-gray-500">
                      {' '}
                      / {job.max_responses} max
                    </span>
                    {/* Progress bar */}
                    <div className="mt-2 h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-green-500 transition-all"
                        style={{
                          width: `${Math.min(
                            (job.response_count / job.max_responses) * 100,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                  </dd>
                </div>
              )}

              <div>
                <dt className="text-sm text-gray-500">Category</dt>
                <dd className="mt-1">
                  {category ? (
                    <Link
                      href={`/categories/${category.slug}`}
                      className="text-sm font-medium text-green-700 hover:text-green-800"
                    >
                      {category.name}
                    </Link>
                  ) : (
                    <span className="text-sm text-gray-500">Uncategorized</span>
                  )}
                </dd>
              </div>

              <div>
                <dt className="text-sm text-gray-500">Response Deadline</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {deadline.toLocaleDateString('en-NG', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </dd>
              </div>
            </dl>

            {isOpen && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <Link
                  href="/writer/login"
                  className="block w-full rounded-lg bg-green-700 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-green-800 transition-colors"
                >
                  Respond to This Job
                </Link>
                <p className="mt-2 text-xs text-gray-400 text-center">
                  Sign in as a writer to submit a response
                </p>
              </div>
            )}

            {job.status === 'filled' && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-500 text-center">
                  This job has been filled.
                </p>
              </div>
            )}

            {job.status === 'closed' && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-500 text-center">
                  This job posting is closed.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatusBadge({
  status,
  isExpired,
}: {
  status: string
  isExpired: boolean
}) {
  if (status === 'open' && isExpired) {
    return (
      <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
        Expired
      </span>
    )
  }

  const styles: Record<string, string> = {
    open: 'bg-green-100 text-green-700',
    closed: 'bg-gray-100 text-gray-600',
    filled: 'bg-blue-100 text-blue-700',
  }

  const labels: Record<string, string> = {
    open: 'Open',
    closed: 'Closed',
    filled: 'Filled',
  }

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        styles[status] ?? 'bg-gray-100 text-gray-600'
      }`}
    >
      {labels[status] ?? status}
    </span>
  )
}

function getTimeRemaining(deadline: Date): string {
  const now = new Date()
  const diff = deadline.getTime() - now.getTime()

  if (diff <= 0) return 'Expired'

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

  if (days > 0) return `${days}d ${hours}h remaining`
  if (hours > 0) return `${hours}h ${minutes}m remaining`
  return `${minutes}m remaining`
}

function formatPrice(amount: number): string {
  return `₦${amount.toLocaleString()}`
}
