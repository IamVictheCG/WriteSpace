import { requireRole } from '@/lib/access/require-role'
import { supabaseService } from '@/lib/supabase/service'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ProjectMessages } from './project-messages'
import { ProjectActions } from './project-actions'

export default async function WriterProjectDetailPage(
  props: PageProps<'/writer/projects/[id]'>
) {
  const auth = await requireRole('writer')
  const { id } = await props.params

  // Fetch project details
  const { data: project } = await supabaseService
    .from('projects')
    .select('id, title, description, status, agreed_price_ngn, created_at, updated_at, writer_completed_at, client_profiles(username)')
    .eq('id', id)
    .eq('writer_id', auth.profileId!)
    .single()

  if (!project) {
    notFound()
  }

  const client = project.client_profiles as unknown as { username: string } | null

  const statusLabels: Record<string, string> = {
    active: 'Active',
    writer_completed: 'Awaiting Client Approval',
    completed: 'Completed',
    disputed: 'Disputed',
    pending_payment: 'Pending Payment',
  }

  const statusStyles: Record<string, string> = {
    active: 'bg-blue-100 text-blue-700',
    writer_completed: 'bg-yellow-100 text-yellow-700',
    completed: 'bg-green-100 text-green-700',
    disputed: 'bg-red-100 text-red-700',
    pending_payment: 'bg-orange-100 text-orange-700',
  }

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href="/writer/projects"
        className="mb-6 inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Projects
      </Link>

      {/* Project Header */}
      <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{project.title}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-500">
              {client && <span>Client: {client.username}</span>}
              <span>Started {new Date(project.created_at).toLocaleDateString()}</span>
            </div>
          </div>

          <div className="text-right">
            <p className="text-2xl font-bold text-green-700">
              {'₦'}{(project.agreed_price_ngn ?? 0).toLocaleString()}
            </p>
            <span className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[project.status] ?? 'bg-gray-100 text-gray-700'}`}>
              {statusLabels[project.status] ?? project.status}
            </span>
          </div>
        </div>

        {project.description && (
          <div className="mt-6 border-t pt-6">
            <h2 className="mb-2 text-sm font-semibold text-gray-900">Project Description</h2>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
              {project.description}
            </p>
          </div>
        )}

        {project.writer_completed_at && (
          <div className="mt-4 rounded-lg bg-yellow-50 p-3 text-sm text-yellow-700">
            You marked this project as complete on{' '}
            {new Date(project.writer_completed_at).toLocaleDateString()}.
            Waiting for client approval.
          </div>
        )}
      </div>

      {/* Actions (Mark Complete / File Upload) */}
      <ProjectActions projectId={project.id} status={project.status} />

      {/* Messages Section */}
      <div className="mt-6">
        <ProjectMessages projectId={project.id} currentUserId={auth.userId} />
      </div>
    </div>
  )
}
