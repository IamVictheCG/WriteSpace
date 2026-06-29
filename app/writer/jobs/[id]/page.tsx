import { requireRole } from '@/lib/access/require-role'
import { supabaseService } from '@/lib/supabase/service'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { JobResponseForm } from './response-form'

export default async function WriterJobDetailPage(
  props: PageProps<'/writer/jobs/[id]'>
) {
  const auth = await requireRole('writer')
  const { id } = await props.params

  // Fetch job details
  const { data: job } = await supabaseService
    .from('job_postings')
    .select('id, title, description, budget_ngn, status, response_deadline, response_count, max_responses, created_at, category_id, categories(name), client_profiles(username)')
    .eq('id', id)
    .single()

  if (!job) {
    notFound()
  }

  // Check if writer already responded
  const { data: existingResponse } = await supabaseService
    .from('job_responses')
    .select('id, pitch_text, proposed_price_ngn, created_at')
    .eq('job_id', id)
    .eq('writer_id', auth.profileId!)
    .single()

  const category = job.categories as unknown as { name: string } | null
  const client = job.client_profiles as unknown as { username: string } | null
  const deadline = new Date(job.response_deadline)
  const now = new Date()
  const isExpired = deadline < now
  const hoursLeft = Math.max(0, Math.round((deadline.getTime() - now.getTime()) / (1000 * 60 * 60)))
  const isFull = job.response_count >= job.max_responses
  const canRespond = job.status === 'open' && !isExpired && !isFull && !existingResponse

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/writer/jobs"
        className="mb-6 inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Jobs
      </Link>

      {/* Job Details Card */}
      <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-500">
              {category && (
                <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                  {category.name}
                </span>
              )}
              {client && <span>by {client.username}</span>}
              <span>Posted {new Date(job.created_at).toLocaleDateString()}</span>
            </div>
          </div>

          <div className="text-right">
            <p className="text-2xl font-bold text-green-700">
              {'₦'}{job.budget_ngn.toLocaleString()}
            </p>
            <span className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
              job.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
            }`}>
              {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
            </span>
          </div>
        </div>

        <div className="mt-6 border-t pt-6">
          <h2 className="mb-2 text-sm font-semibold text-gray-900">Description</h2>
          <div className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
            {job.description}
          </div>
        </div>

        <div className="mt-6 grid gap-4 border-t pt-6 sm:grid-cols-3">
          <div>
            <p className="text-xs font-medium text-gray-500">Time Remaining</p>
            <p className={`mt-1 text-sm font-semibold ${isExpired ? 'text-red-600' : 'text-gray-900'}`}>
              {isExpired ? 'Expired' : `${hoursLeft} hours`}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500">Responses</p>
            <p className="mt-1 text-sm font-semibold text-gray-900">
              {job.response_count} / {job.max_responses}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500">Deadline</p>
            <p className="mt-1 text-sm font-semibold text-gray-900">
              {deadline.toLocaleDateString()} at {deadline.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
      </div>

      {/* Already Responded */}
      {existingResponse && (
        <div className="mt-6 rounded-xl bg-blue-50 p-6 ring-1 ring-blue-200">
          <h2 className="text-lg font-semibold text-blue-900">Your Response</h2>
          <p className="mt-2 text-sm text-blue-800">
            You submitted a response on {new Date(existingResponse.created_at).toLocaleDateString()}.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium text-blue-600">Proposed Price</p>
              <p className="mt-1 text-lg font-bold text-blue-900">
                {'₦'}{existingResponse.proposed_price_ngn.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-blue-600">Your Pitch</p>
              <p className="mt-1 text-sm text-blue-800">{existingResponse.pitch_text}</p>
            </div>
          </div>
        </div>
      )}

      {/* Response Form */}
      {canRespond && (
        <div className="mt-6 rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Submit Your Response</h2>
          <JobResponseForm jobId={job.id} budget={job.budget_ngn} />
        </div>
      )}

      {/* Cannot respond messages */}
      {!canRespond && !existingResponse && (
        <div className="mt-6 rounded-xl bg-gray-50 p-6 text-center text-sm text-gray-600 ring-1 ring-gray-200">
          {job.status !== 'open' && <p>This job is no longer accepting responses.</p>}
          {isExpired && job.status === 'open' && <p>The deadline for this job has passed.</p>}
          {isFull && !isExpired && job.status === 'open' && <p>This job has reached the maximum number of responses.</p>}
        </div>
      )}
    </div>
  )
}
