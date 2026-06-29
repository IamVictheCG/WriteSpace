import { NextResponse } from 'next/server'
import { supabaseService } from '@/lib/supabase/service'
import { requireRole, requireOwnership, handleAuthError } from '@/lib/access/require-role'
import { z } from 'zod'

const selectSchema = z.object({
  job_id: z.string().uuid(),
  response_id: z.string().uuid(),
})

export async function POST(request: Request) {
  try {
    const auth = await requireRole('client')
    const body = await request.json()
    const parsed = selectSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed' }, { status: 400 })
    }

    // Verify client owns this job
    await requireOwnership('job_postings', parsed.data.job_id, 'client_id', auth.profileId!)

    // Get the selected response
    const { data: response } = await supabaseService
      .from('job_responses')
      .select('id, writer_id, proposed_price_ngn, job_postings!inner(title, description)')
      .eq('id', parsed.data.response_id)
      .eq('job_id', parsed.data.job_id)
      .single()

    if (!response) {
      return NextResponse.json({ error: 'Response not found' }, { status: 404 })
    }

    // Create the project
    const jobData = response.job_postings as unknown as { title: string; description: string }
    const { data: project, error: projectError } = await supabaseService
      .from('projects')
      .insert({
        job_id: parsed.data.job_id,
        client_id: auth.profileId,
        writer_id: response.writer_id,
        title: jobData.title,
        description: jobData.description,
        agreed_price_ngn: response.proposed_price_ngn,
        status: 'awaiting_payment',
      })
      .select('id')
      .single()

    if (projectError || !project) {
      return NextResponse.json({ error: 'Failed to create project' }, { status: 500 })
    }

    // Update job and response statuses
    await supabaseService
      .from('job_postings')
      .update({ status: 'filled', updated_at: new Date().toISOString() })
      .eq('id', parsed.data.job_id)

    await supabaseService
      .from('job_responses')
      .update({ status: 'accepted' })
      .eq('id', parsed.data.response_id)

    await supabaseService
      .from('job_responses')
      .update({ status: 'rejected' })
      .eq('job_id', parsed.data.job_id)
      .neq('id', parsed.data.response_id)

    return NextResponse.json({ project_id: project.id, message: 'Writer selected. Please proceed to payment.' })
  } catch (err) {
    return handleAuthError(err)
  }
}
