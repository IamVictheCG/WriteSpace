import { requireRole } from '@/lib/access/require-role'
import { supabaseService } from '@/lib/supabase/service'
import Link from 'next/link'

export default async function WriterDashboardPage() {
  const auth = await requireRole('writer')

  // Fetch writer profile
  const { data: profile } = await supabaseService
    .from('writer_profiles')
    .select('id, username, full_name, is_verified')
    .eq('user_id', auth.userId)
    .single()

  if (!profile) {
    return (
      <div className="rounded-lg bg-red-50 p-6 text-red-700">
        Writer profile not found. Please contact support.
      </div>
    )
  }

  // Fetch stats in parallel
  const [completedJobsResult, ratingsResult, walletResult, recentProjectsResult, writerCategoriesResult] = await Promise.all([
    // Completed projects count
    supabaseService
      .from('projects')
      .select('id', { count: 'exact', head: true })
      .eq('writer_id', profile.id)
      .eq('status', 'completed'),

    // Average rating
    supabaseService
      .from('projects')
      .select('client_rating')
      .eq('writer_id', profile.id)
      .not('client_rating', 'is', null),

    // Wallet balance
    supabaseService
      .from('wallets')
      .select('balance_ngn, total_earned_ngn')
      .eq('writer_id', profile.id)
      .single(),

    // Recent projects
    supabaseService
      .from('projects')
      .select('id, title, status, agreed_price_ngn, created_at, client_profiles(username)')
      .eq('writer_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(5),

    // Writer's categories
    supabaseService
      .from('writer_categories')
      .select('category_id')
      .eq('writer_id', profile.id),
  ])

  const completedCount = completedJobsResult.count ?? 0

  // Calculate average rating
  const ratings = ratingsResult.data ?? []
  const avgRating =
    ratings.length > 0
      ? ratings.reduce((sum, r) => sum + (r.client_rating ?? 0), 0) / ratings.length
      : 0

  const wallet = walletResult.data
  const recentProjects = recentProjectsResult.data ?? []

  // Fetch matching job postings
  const categoryIds = (writerCategoriesResult.data ?? []).map((wc) => wc.category_id)
  let recentJobs: Array<{
    id: string
    title: string
    budget_ngn: number
    response_deadline: string
    response_count: number
    max_responses: number
    categories: { name: string } | null
  }> = []

  if (categoryIds.length > 0) {
    const { data } = await supabaseService
      .from('job_postings')
      .select('id, title, budget_ngn, response_deadline, response_count, max_responses, categories(name)')
      .eq('status', 'open')
      .in('category_id', categoryIds)
      .order('created_at', { ascending: false })
      .limit(5)

    recentJobs = (data ?? []) as unknown as typeof recentJobs
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {profile.username}
          {profile.is_verified && (
            <span className="ml-2 inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
              Verified
            </span>
          )}
        </h1>
        <p className="mt-1 text-sm text-gray-600">Here&apos;s an overview of your activity</p>
      </div>

      {/* Stats Grid */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
          <p className="text-sm font-medium text-gray-500">Completed Jobs</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{completedCount}</p>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
          <p className="text-sm font-medium text-gray-500">Average Rating</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {avgRating > 0 ? avgRating.toFixed(1) : '--'}
            <span className="ml-1 text-lg text-yellow-500">{avgRating > 0 ? '★' : ''}</span>
          </p>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
          <p className="text-sm font-medium text-gray-500">Wallet Balance</p>
          <p className="mt-2 text-3xl font-bold text-green-700">
            {'₦'}{(wallet?.balance_ngn ?? 0).toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Total earned: {'₦'}{(wallet?.total_earned_ngn ?? 0).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Recent Projects */}
        <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
          <div className="flex items-center justify-between border-b px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Projects</h2>
            <Link href="/writer/projects" className="text-sm font-medium text-green-600 hover:text-green-500">
              View all
            </Link>
          </div>
          {recentProjects.length === 0 ? (
            <p className="p-6 text-sm text-gray-500">No projects yet.</p>
          ) : (
            <ul className="divide-y">
              {recentProjects.map((project) => {
                const client = project.client_profiles as unknown as { username: string } | null
                return (
                  <li key={project.id}>
                    <Link href={`/writer/projects/${project.id}`} className="block px-6 py-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900">{project.title}</p>
                        <StatusBadge status={project.status} />
                      </div>
                      <div className="mt-1 flex items-center gap-4 text-xs text-gray-500">
                        <span>Client: {client?.username ?? 'N/A'}</span>
                        <span>{'₦'}{(project.agreed_price_ngn ?? 0).toLocaleString()}</span>
                      </div>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {/* Matching Jobs */}
        <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
          <div className="flex items-center justify-between border-b px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">New Jobs For You</h2>
            <Link href="/writer/jobs" className="text-sm font-medium text-green-600 hover:text-green-500">
              View all
            </Link>
          </div>
          {recentJobs.length === 0 ? (
            <p className="p-6 text-sm text-gray-500">No matching jobs right now.</p>
          ) : (
            <ul className="divide-y">
              {recentJobs.map((job) => {
                const category = job.categories as unknown as { name: string } | null
                const deadline = new Date(job.response_deadline)
                const now = new Date()
                const hoursLeft = Math.max(0, Math.round((deadline.getTime() - now.getTime()) / (1000 * 60 * 60)))

                return (
                  <li key={job.id}>
                    <Link href={`/writer/jobs/${job.id}`} className="block px-6 py-4 hover:bg-gray-50">
                      <p className="text-sm font-medium text-gray-900">{job.title}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                        {category && (
                          <span className="rounded-full bg-gray-100 px-2 py-0.5">{category.name}</span>
                        )}
                        <span>{'₦'}{job.budget_ngn.toLocaleString()}</span>
                        <span>{hoursLeft}h left</span>
                        <span>{job.response_count}/{job.max_responses} responses</span>
                      </div>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: 'bg-blue-100 text-blue-700',
    writer_completed: 'bg-yellow-100 text-yellow-700',
    completed: 'bg-green-100 text-green-700',
    disputed: 'bg-red-100 text-red-700',
    pending_payment: 'bg-orange-100 text-orange-700',
  }

  const labels: Record<string, string> = {
    active: 'Active',
    writer_completed: 'Awaiting Approval',
    completed: 'Completed',
    disputed: 'Disputed',
    pending_payment: 'Pending Payment',
  }

  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${styles[status] ?? 'bg-gray-100 text-gray-700'}`}>
      {labels[status] ?? status}
    </span>
  )
}
