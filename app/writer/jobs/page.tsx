import { requireRole } from '@/lib/access/require-role'
import { supabaseService } from '@/lib/supabase/service'
import Link from 'next/link'

export default async function WriterJobsPage(
  props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }
) {
  const auth = await requireRole('writer')
  const searchParams = await props.searchParams
  const statusFilter = (searchParams.status as string) ?? 'open'

  // Get writer's registered categories
  const { data: writerCategories } = await supabaseService
    .from('writer_categories')
    .select('category_id')
    .eq('writer_id', auth.profileId!)

  const categoryIds = (writerCategories ?? []).map((wc) => wc.category_id)

  let jobs: Array<{
    id: string
    title: string
    description: string
    budget_ngn: number
    status: string
    response_deadline: string
    response_count: number
    max_responses: number
    created_at: string
    categories: { name: string } | null
  }> = []

  if (categoryIds.length > 0) {
    let query = supabaseService
      .from('job_postings')
      .select('id, title, description, budget_ngn, status, response_deadline, response_count, max_responses, created_at, categories(name)')
      .in('category_id', categoryIds)
      .order('created_at', { ascending: false })

    if (statusFilter) {
      query = query.eq('status', statusFilter)
    }

    const { data } = await query
    jobs = (data ?? []) as unknown as typeof jobs
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Available Jobs</h1>
          <p className="mt-1 text-sm text-gray-600">
            Jobs matching your registered writing categories
          </p>
        </div>
      </div>

      {/* Status Filter */}
      <div className="mb-6 flex gap-2">
        {['open', 'closed'].map((status) => (
          <Link
            key={status}
            href={`/writer/jobs?status=${status}`}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              statusFilter === status
                ? 'bg-green-600 text-white'
                : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Link>
        ))}
      </div>

      {categoryIds.length === 0 ? (
        <div className="rounded-xl bg-yellow-50 p-6 text-sm text-yellow-700 ring-1 ring-yellow-200">
          <p className="font-medium">No categories registered</p>
          <p className="mt-1">
            Go to your{' '}
            <Link href="/writer/account" className="font-medium underline">
              Account settings
            </Link>{' '}
            to add writing categories and start seeing jobs.
          </p>
        </div>
      ) : jobs.length === 0 ? (
        <div className="rounded-xl bg-white p-12 text-center shadow-sm ring-1 ring-gray-200">
          <p className="text-gray-500">No {statusFilter} jobs matching your categories right now.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => {
            const category = job.categories as unknown as { name: string } | null
            const deadline = new Date(job.response_deadline)
            const now = new Date()
            const hoursLeft = Math.max(0, Math.round((deadline.getTime() - now.getTime()) / (1000 * 60 * 60)))
            const isExpired = deadline < now

            return (
              <Link
                key={job.id}
                href={`/writer/jobs/${job.id}`}
                className="block rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200 transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-semibold text-gray-900">{job.title}</h3>
                      {category && (
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                          {category.name}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-gray-600">
                      {job.description}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-lg font-bold text-green-700">
                      {'₦'}{job.budget_ngn.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {isExpired ? (
                      <span className="text-red-500">Expired</span>
                    ) : (
                      <span>{hoursLeft}h remaining</span>
                    )}
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {job.response_count}/{job.max_responses} responses
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
