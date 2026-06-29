import Link from 'next/link'
import { requireRole } from '@/lib/access/require-role'
import { supabaseService } from '@/lib/supabase/service'

const STATUS_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'awaiting_payment', label: 'Awaiting Payment' },
  { value: 'active', label: 'Active' },
  { value: 'writer_completed', label: 'Writer Completed' },
  { value: 'completed', label: 'Completed' },
  { value: 'disputed', label: 'Disputed' },
  { value: 'cancelled', label: 'Cancelled' },
]

export default async function ClientProjectsPage(
  props: PageProps<'/client/projects'>
) {
  const auth = await requireRole('client')

  const searchParams = await props.searchParams
  const statusFilter = typeof searchParams.status === 'string' ? searchParams.status : ''

  let query = supabaseService
    .from('projects')
    .select('id, title, status, agreed_price_ngn, created_at, writer_profiles(username)')
    .eq('client_id', auth.profileId)
    .order('created_at', { ascending: false })

  if (statusFilter) {
    query = query.eq('status', statusFilter)
  }

  const { data: projects } = await query

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Projects</h1>
          <p className="mt-1 text-gray-600">Track and manage all your writing projects</p>
        </div>
        <Link
          href="/client/post-job"
          className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Post Job
        </Link>
      </div>

      {/* Status filter */}
      <div className="flex flex-wrap gap-2">
        {STATUS_OPTIONS.map((opt) => (
          <Link
            key={opt.value}
            href={opt.value ? `/client/projects?status=${opt.value}` : '/client/projects'}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              statusFilter === opt.value
                ? 'bg-green-600 text-white'
                : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {opt.label}
          </Link>
        ))}
      </div>

      {/* Projects list */}
      {projects && projects.length > 0 ? (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Title
                </th>
                <th className="hidden sm:table-cell px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
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
              {projects.map((project) => {
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
                      <p className="sm:hidden text-xs text-gray-500 mt-0.5">
                        {writer?.username ?? 'No writer'}
                      </p>
                    </td>
                    <td className="hidden sm:table-cell px-4 py-3 text-sm text-gray-600">
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
          <p className="text-gray-500">
            {statusFilter
              ? `No projects with status "${STATUS_OPTIONS.find((o) => o.value === statusFilter)?.label ?? statusFilter}".`
              : 'No projects yet.'}
          </p>
          <Link
            href="/client/post-job"
            className="mt-3 inline-block text-sm font-medium text-green-600 hover:text-green-500"
          >
            Post your first job
          </Link>
        </div>
      )}
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
