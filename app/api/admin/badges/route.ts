import { NextResponse } from 'next/server'
import { supabaseService } from '@/lib/supabase/service'
import { requireRole, handleAuthError } from '@/lib/access/require-role'
import { z } from 'zod'

export async function GET() {
  try {
    await requireRole('admin')

    const { data: applications } = await supabaseService
      .from('badge_applications')
      .select('id, portfolio_notes, status, submitted_at, decided_at, writer_profiles!inner(id, username, full_name)')
      .order('submitted_at', { ascending: false })

    return NextResponse.json(applications || [])
  } catch (err) {
    return handleAuthError(err)
  }
}

const reviewSchema = z.object({
  application_id: z.string().uuid(),
  action: z.enum(['approved', 'rejected']),
  review_notes: z.string().optional(),
})

export async function PATCH(request: Request) {
  try {
    const auth = await requireRole('admin')
    const body = await request.json()
    const parsed = reviewSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed' }, { status: 400 })
    }

    if (parsed.data.action === 'approved') {
      // Use atomic database function
      const { error } = await supabaseService.rpc('approve_badge_application', {
        p_application_id: parsed.data.application_id,
        p_reviewer_id: auth.userId,
        p_review_notes: parsed.data.review_notes || null,
      })

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }
    } else {
      await supabaseService
        .from('badge_applications')
        .update({
          status: 'rejected',
          reviewer_id: auth.userId,
          review_notes: parsed.data.review_notes || null,
          decided_at: new Date().toISOString(),
        })
        .eq('id', parsed.data.application_id)
    }

    return NextResponse.json({ message: `Application ${parsed.data.action}` })
  } catch (err) {
    return handleAuthError(err)
  }
}
