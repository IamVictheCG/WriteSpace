import { requireRole } from '@/lib/access/require-role'
import { supabaseService } from '@/lib/supabase/service'
import Link from 'next/link'

const statusOptions = ['all', 'active', 'pending_payment', 'writer_completed', 'completed', 'disputed'] as const

const statusLabels: Record<string, string> = {
  all: 'All',
  active: 'Active',
  pending_payment: 'Pending Payment',
  writer_completed: 'Awaiting Approval',
  completed: 'Completed',
  disputed: 'Disputed',
}

const statusStyles: Record<string, string> = {
  active: 'bg-blue-100 text-blue-700',
  writer_completed: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-green-100 text-green-700',
  disputed: 'bg-red-100 text-red-700',
  pending_payment: 'bg-orange-100 text-orange-700',
}

export default async function WriterProjectsPage(
  props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }
) {
  const auth = await requireRole('writer')
  const searchParams = await props.searchParams
  const statusFilter = (searchParams.status as string) ?? 'all'

  let query = supabaseService
    .from('projects')
    .select('id, title, status, agreed_price_ngn, created_at, client_profiles(username)')
    .eq('writer_id', auth.profileId!)
    .order('created_at', { ascending: false })

  if (statusFilter !== 'all') {
    query = query.eq('status', statusFilter)
  }

  const { data: projects } = await query
  const projectList = projects ?? []

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Projects</h1>
        <p className="mt-1 text-sm text-gray-600">
          Manage your active and completed projects
        </p>
      </div>

      {/* Status Filter */}
      <div className="mb-6 flex flex-wrap gap-2">
        {statusOptions.map((status) => (
          <Link
            key={status}
            href={`/writer/projects?status=${status}`}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              statusFilter === status
                ? 'bg-green-600 text-white'
                : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50'
            }`}
          >
            {statusLabels[status] ?? status}
          </Link>
        ))}
      </div>

      {projectList.length === 0 ? (
        <div className="rounded-xl bg-white p-12 text-center shadow-sm ring-1 ring-gray-200">
          <p className="text-gray-500">
            {statusFilter === 'all'
              ? 'You have no projects yet. Browse jobs and submit responses to get started.'
              : `No projects with status "${statusLabels[statusFilter] ?? statusFilter}".`}
          </p>
          {statusFilter === 'all' && (
            <Link
              href="/writer/jobs"
              className="mt-4 inline-block rounded-lg bg-green-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-green-700"
            >
              Browse Jobs
            </Link>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                <th className="px-6 py-3">Project</th>
                <th className="px-6 py-3">Client</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Agreed Price</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {projectList.map((project) => {
                const client = project.client_profiles as unknown as { username: string } | null
                return (
                  <tr key={project.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <Link
                        href={`/writer/projects/${project.id}`}
                        className="text-sm font-medium text-green-700 hover:text-green-600"
                      >
                        {project.title}
                      </Link>
                      <p className="mt-0.5 text-xs text-gray-500">
                        {new Date(project.created_at).toLocaleDateString()}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {client?.username ?? 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[project.status] ?? 'bg-gray-100 text-gray-700'}`}>
                        {statusLabels[project.status] ?? project.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                      {'₦'}{(project.agreed_price_ngn ?? 0).toLocaleString()}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
