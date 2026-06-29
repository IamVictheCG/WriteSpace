import { NextResponse } from 'next/server'
import { supabaseService } from '@/lib/supabase/service'
import { requireRole, requireOwnership, handleAuthError } from '@/lib/access/require-role'
import { sendDisputeOpenedAlert } from '@/lib/emails/admin-emails'
import { z } from 'zod'

const disputeSchema = z.object({
  project_id: z.string().uuid(),
  reason: z.string().min(10).max(2000),
})

export async function POST(request: Request) {
  try {
    const auth = await requireRole('client')
    const body = await request.json()
    const parsed = disputeSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed' }, { status: 400 })
    }

    await requireOwnership('projects', parsed.data.project_id, 'client_id', auth.profileId!)

    const { data: project } = await supabaseService
      .from('projects')
      .select('id, title, status')
      .eq('id', parsed.data.project_id)
      .single()

    if (!project || !['active', 'writer_completed'].includes(project.status)) {
      return NextResponse.json({ error: 'Cannot dispute this project' }, { status: 400 })
    }

    // Check no existing dispute
    const { data: existingDispute } = await supabaseService
      .from('disputes')
      .select('id')
      .eq('project_id', parsed.data.project_id)
      .single()

    if (existingDispute) {
      return NextResponse.json({ error: 'A dispute already exists for this project' }, { status: 409 })
    }

    await supabaseService.from('disputes').insert({
      project_id: parsed.data.project_id,
      initiated_by: auth.userId,
      reason: parsed.data.reason,
    })

    await supabaseService
      .from('projects')
      .update({ status: 'disputed', updated_at: new Date().toISOString() })
      .eq('id', parsed.data.project_id)

    // Notify admin
    sendDisputeOpenedAlert(project.title, parsed.data.reason).catch(() => {})

    return NextResponse.json({ message: 'Dispute filed. Admin will review.' })
  } catch (err) {
    return handleAuthError(err)
  }
}
