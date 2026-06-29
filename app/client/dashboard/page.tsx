import Link from 'next/link'
import { requireRole } from '@/lib/access/require-role'
import { supabaseService } from '@/lib/supabase/service'

export default async function ClientDashboardPage() {
  const auth = await requireRole('client')

  // Fetch client profile
  const { data: profile } = await supabaseService
    .from('client_profiles')
    .select('username')
    .eq('id', auth.profileId)
    .single()

  // Fetch project stats
  const { count: activeCount } = await supabaseService
    .from('projects')
    .select('id', { count: 'exact', head: true })
    .eq('client_id', auth.profileId)
    .in('status', ['awaiting_payment', 'active', 'writer_completed'])

  const { count: completedCount } = await supabaseService
    .from('projects')
    .select('id', { count: 'exact', head: true })
    .eq('client_id', auth.profileId)
    .eq('status', 'completed')

  // Fetch recent projects
  const { data: recentProjects } = await supabaseService
    .from('projects')
    .select('id, title, status, agreed_price_ngn, created_at, writer_profiles(username)')
    .eq('client_id', auth.profileId)
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {profile?.username ?? 'Client'}
        </h1>
        <p className="mt-1 text-gray-600">Here&apos;s an overview of your projects</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Active Projects" value={activeCount ?? 0} color="blue" />
        <StatCard label="Completed Projects" value={completedCount ?? 0} color="green" />
        <Link
          href="/client/post-job"
          className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-green-300 bg-green-50 p-6 text-green-700 hover:border-green-400 hover:bg-green-100 transition-colors"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          <span className="font-semibold">Post a New Job</span>
        </Link>
      </div>

      {/* Recent Projects */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Projects</h2>
          <Link
            href="/client/projects"
            className="text-sm font-medium text-green-600 hover:text-green-500"
          >
            View all
          </Link>
        </div>

        {recentProjects && recentProjects.length > 0 ? (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Title
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Writer
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Price
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {recentProjects.map((project) => {
                  const writer = project.writer_profiles as unknown as { username: string } | null
                  return (
                    <tr key={project.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <Link
                          href={`/client/projects/${project.id}`}
                          className="text-sm font-medium text-gray-900 hover:text-green-600"
                        >
                          {project.title}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {writer?.username ?? '-'}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={project.status} />
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                        {project.agreed_price_ngn != null
                          ? `₦${Number(project.agreed_price_ngn).toLocaleString()}`
                          : '-'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-xl border border-gray-200 bg-white px-6 py-12 text-center">
            <p className="text-gray-500">No projects yet.</p>
            <Link
              href="/client/post-job"
              className="mt-3 inline-block text-sm font-medium text-green-600 hover:text-green-500"
            >
              Post your first job
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string
  value: number
  color: 'blue' | 'green'
}) {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    green: 'bg-green-50 text-green-700 border-green-200',
  }

  return (
    <div className={`rounded-xl border p-6 ${colorMap[color]}`}>
      <p className="text-sm font-medium opacity-80">{label}</p>
      <p className="mt-1 text-3xl font-bold">{value}</p>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    awaiting_payment: 'bg-yellow-100 text-yellow-800',
    active: 'bg-blue-100 text-blue-800',
    writer_completed: 'bg-purple-100 text-purple-800',
    completed: 'bg-green-100 text-green-800',
    disputed: 'bg-red-100 text-red-800',
    cancelled: 'bg-gray-100 text-gray-800',
  }

  const labels: Record<string, string> = {
    awaiting_payment: 'Awaiting Payment',
    active: 'Active',
    writer_completed: 'Writer Completed',
    completed: 'Completed',
    disputed: 'Disputed',
    cancelled: 'Cancelled',
  }

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        styles[status] ?? 'bg-gray-100 text-gray-800'
      }`}
    >
      {labels[status] ?? status}
    </span>
  )
}
