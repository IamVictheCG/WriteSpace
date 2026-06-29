import { NextResponse } from 'next/server'
import { supabaseService } from '@/lib/supabase/service'
import { requireRole, handleAuthError } from '@/lib/access/require-role'
import { jobPostSchema } from '@/lib/validators/job-post.schema'
import { calculateResponseDeadline } from '@/lib/utils/response-window'

export async function POST(request: Request) {
  try {
    const auth = await requireRole('client')
    const body = await request.json()
    const parsed = jobPostSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    // Get platform settings for response window and max responses
    const { data: settings } = await supabaseService
      .from('platform_settings')
      .select('key, value')
      .in('key', ['job_response_window_hours', 'max_job_responses'])

    const settingsMap = Object.fromEntries(
      (settings || []).map(s => [s.key, s.value])
    )

    const windowHours = Number(settingsMap.job_response_window_hours || 48)
    const maxResponses = Number(settingsMap.max_job_responses || 5)

    const { data: job, error } = await supabaseService
      .from('job_postings')
      .insert({
        client_id: auth.profileId,
        title: parsed.data.title,
        description: parsed.data.description,
        category_id: parsed.data.category_id,
        budget_ngn: parsed.data.budget_ngn || null,
        max_responses: maxResponses,
        response_deadline: calculateResponseDeadline(windowHours),
      })
      .select('id')
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to create job posting' }, { status: 500 })
    }

    // Notify writers in this category (fire and forget)
    const { data: writers } = await supabaseService
      .from('writer_categories')
      .select('writer_id, writer_profiles!inner(user_id)')
      .eq('category_id', parsed.data.category_id)

    // Email notifications would be sent here via sendJobMatchNotification

    return NextResponse.json({ id: job.id, message: 'Job posted successfully' })
  } catch (err) {
    return handleAuthError(err)
  }
}
