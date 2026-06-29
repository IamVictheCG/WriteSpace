import { NextResponse } from 'next/server'
import { supabaseService } from '@/lib/supabase/service'
import { requireRole, handleAuthError } from '@/lib/access/require-role'
import { z } from 'zod'

export async function GET() {
  try {
    await requireRole('admin')

    const { data: flags } = await supabaseService
      .from('message_flags')
      .select('id, matched_pattern, status, created_at, messages!inner(id, content, sender_id, project_id)')
      .order('created_at', { ascending: false })

    return NextResponse.json(flags || [])
  } catch (err) {
    return handleAuthError(err)
  }
}

const reviewSchema = z.object({
  flag_id: z.string().uuid(),
  action: z.enum(['released', 'edit_requested', 'escalated']),
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

    const { error } = await supabaseService
      .from('message_flags')
      .update({
        status: parsed.data.action,
        reviewed_by: auth.userId,
        review_notes: parsed.data.review_notes || null,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', parsed.data.flag_id)

    if (error) {
      return NextResponse.json({ error: 'Failed to update flag' }, { status: 500 })
    }

    // If released, unflag the message so it becomes visible
    if (parsed.data.action === 'released') {
      const { data: flag } = await supabaseService
        .from('message_flags')
        .select('message_id')
        .eq('id', parsed.data.flag_id)
        .single()

      if (flag) {
        await supabaseService
          .from('messages')
          .update({ is_flagged: false })
          .eq('id', flag.message_id)
      }
    }

    return NextResponse.json({ message: 'Flag reviewed' })
  } catch (err) {
    return handleAuthError(err)
  }
}
