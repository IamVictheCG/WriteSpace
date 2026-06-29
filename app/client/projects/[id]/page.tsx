import { requireRole } from '@/lib/access/require-role'
import { supabaseService } from '@/lib/supabase/service'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import ProjectMessages from './project-messages'
import { ApproveWorkButton, FileDisputeButton } from './project-actions'

export default async function ProjectDetailPage(
  props: PageProps<'/client/projects/[id]'>
) {
  const auth = await requireRole('client')
  const { id } = await props.params

  // Fetch project with writer info
  const { data: project, error } = await supabaseService
    .from('projects')
    .select('id, title, description, status, agreed_price_ngn, created_at, updated_at, writer_id, writer_profiles(username)')
    .eq('id', id)
    .eq('client_id', auth.profileId)
    .single()

  if (error || !project) {
    notFound()
  }

  const writer = project.writer_profiles as unknown as { username: string } | null

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Back link */}
      <Link
        href="/client/projects"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
        </svg>
        Back to Projects
      </Link>

      {/* Project info */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{project.title}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-500">
              <StatusBadge status={project.status} />
              {project.agreed_price_ngn != null && (
                <span className="font-medium text-gray-900">
                  {`₦${Number(project.agreed_price_ngn).toLocaleString()}`}
                </span>
              )}
              <span>
                Created {new Date(project.created_at).toLocaleDateString('en-NG', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            {project.status === 'completed' && (
              <Link
                href={`/client/projects/${project.id}/review`}
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 transition-colors"
              >
                Leave Review
              </Link>
            )}
          </div>
        </div>

        <div className="mt-4 border-t border-gray-100 pt-4">
          <h3 className="text-sm font-medium text-gray-700 mb-1">Description</h3>
          <p className="text-sm text-gray-600 whitespace-pre-wrap">{project.description}</p>
        </div>

        <div className="mt-4 border-t border-gray-100 pt-4">
          <h3 className="text-sm font-medium text-gray-700 mb-1">Writer</h3>
          <p className="text-sm text-gray-600">{writer?.username ?? 'Not assigned'}</p>
        </div>
      </div>

      {/* Action panels */}
      {project.status === 'writer_completed' && (
        <div className="rounded-xl border border-purple-200 bg-purple-50 p-6">
          <h3 className="text-sm font-semibold text-purple-800">Writer has marked this project as complete</h3>
          <p className="mt-1 text-sm text-purple-700">
            Review the work and approve to release payment, or file a dispute if there are issues.
          </p>
          <ProjectActionButtons
            projectId={project.id}
            actions={['approve', 'dispute']}
          />
        </div>
      )}

      {project.status === 'active' && (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-6">
          <h3 className="text-sm font-semibold text-gray-800">Project is in progress</h3>
          <p className="mt-1 text-sm text-gray-600">
            If you encounter any issues with the writer, you can file a dispute.
          </p>
          <ProjectActionButtons
            projectId={project.id}
            actions={['dispute']}
          />
        </div>
      )}

      {/* Messages section */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
        </div>
        <ProjectMessages
          projectId={project.id}
          currentUserId={auth.userId}
        />
      </div>
    </div>
  )
}

function ProjectActionButtons({
  projectId,
  actions,
}: {
  projectId: string
  actions: ('approve' | 'dispute')[]
}) {
  return (
    <div className="mt-4 flex gap-3">
      {actions.includes('approve') && (
        <ApproveButton projectId={projectId} />
      )}
      {actions.includes('dispute') && (
        <DisputeButton projectId={projectId} />
      )}
    </div>
  )
}

function ApproveButton({ projectId }: { projectId: string }) {
  return (
    <form
      action={async () => {
        'use server'
        // This action is handled client-side by the ProjectMessages component
      }}
    >
      <ApproveButtonClient projectId={projectId} />
    </form>
  )
}

function DisputeButton({ projectId }: { projectId: string }) {
  return <DisputeButtonClient projectId={projectId} />
}

// These need to be client components for interactivity
function ApproveButtonClient({ projectId }: { projectId: string }) {
  return <ApproveWorkButton projectId={projectId} />
}

function DisputeButtonClient({ projectId }: { projectId: string }) {
  return <FileDisputeButton projectId={projectId} />
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
