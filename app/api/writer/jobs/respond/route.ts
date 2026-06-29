import { NextResponse } from 'next/server'
import { supabaseService } from '@/lib/supabase/service'
import { requireRole, handleAuthError } from '@/lib/access/require-role'
import { canAcceptMoreResponses } from '@/lib/utils/response-window'
import { z } from 'zod'

const responseSchema = z.object({
  job_id: z.string().uuid(),
  pitch_text: z.string().min(10).max(2000),
  proposed_price_ngn: z.coerce.number().positive(),
})

export async function POST(request: Request) {
  try {
    const auth = await requireRole('writer')
    const body = await request.json()
    const parsed = responseSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    // Check the job exists and is open
    const { data: job } = await supabaseService
      .from('job_postings')
      .select('id, status, response_count, max_responses, response_deadline')
      .eq('id', parsed.data.job_id)
      .single()

    if (!job || job.status !== 'open') {
      return NextResponse.json({ error: 'Job not found or not open' }, { status: 404 })
    }

    if (!canAcceptMoreResponses(job.response_count, job.max_responses, job.response_deadline)) {
      return NextResponse.json({ error: 'This job is no longer accepting responses' }, { status: 400 })
    }

    // Check writer hasn't already responded
    const { data: existingResponse } = await supabaseService
      .from('job_responses')
      .select('id')
      .eq('job_id', parsed.data.job_id)
      .eq('writer_id', auth.profileId!)
      .single()

    if (existingResponse) {
      return NextResponse.json({ error: 'You have already responded to this job' }, { status: 409 })
    }

    // Insert response
    const { error } = await supabaseService
      .from('job_responses')
      .insert({
        job_id: parsed.data.job_id,
        writer_id: auth.profileId,
        pitch_text: parsed.data.pitch_text,
        proposed_price_ngn: parsed.data.proposed_price_ngn,
      })

    if (error) {
      return NextResponse.json({ error: 'Failed to submit response' }, { status: 500 })
    }

    // Increment response count
    await supabaseService
      .from('job_postings')
      .update({ response_count: job.response_count + 1, updated_at: new Date().toISOString() })
      .eq('id', parsed.data.job_id)

    // Close if cap reached
    if (job.response_count + 1 >= job.max_responses) {
      await supabaseService
        .from('job_postings')
        .update({ status: 'closed', updated_at: new Date().toISOString() })
        .eq('id', parsed.data.job_id)
    }

    return NextResponse.json({ message: 'Response submitted' })
  } catch (err) {
    return handleAuthError(err)
  }
}
