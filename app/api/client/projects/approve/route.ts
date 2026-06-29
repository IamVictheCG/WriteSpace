import { NextResponse } from 'next/server'
import { supabaseService } from '@/lib/supabase/service'
import { requireRole, requireOwnership, handleAuthError } from '@/lib/access/require-role'
import { z } from 'zod'

const approveSchema = z.object({
  project_id: z.string().uuid(),
})

export async function POST(request: Request) {
  try {
    const auth = await requireRole('client')
    const body = await request.json()
    const parsed = approveSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed' }, { status: 400 })
    }

    await requireOwnership('projects', parsed.data.project_id, 'client_id', auth.profileId!)

    const { data: project } = await supabaseService
      .from('projects')
      .select('id, status')
      .eq('id', parsed.data.project_id)
      .single()

    if (!project || project.status !== 'writer_completed') {
      return NextResponse.json({ error: 'Project not ready for approval' }, { status: 400 })
    }

    // Find the held transaction
    const { data: transaction } = await supabaseService
      .from('transactions')
      .select('id')
      .eq('project_id', parsed.data.project_id)
      .eq('status', 'held')
      .single()

    if (!transaction) {
      return NextResponse.json({ error: 'No held transaction found' }, { status: 400 })
    }

    // Release escrow via database function (atomic)
    const { error } = await supabaseService.rpc('release_escrow', {
      p_transaction_id: transaction.id,
    })

    if (error) {
      return NextResponse.json({ error: 'Failed to release payment' }, { status: 500 })
    }

    // Update writer's completed jobs count
    const { data: proj } = await supabaseService
      .from('projects')
      .select('writer_id')
      .eq('id', parsed.data.project_id)
      .single()

    if (proj) {
      const { data: writer } = await supabaseService
        .from('writer_profiles')
        .select('completed_jobs_count')
        .eq('id', proj.writer_id)
        .single()

      if (writer) {
        await supabaseService
          .from('writer_profiles')
          .update({
            completed_jobs_count: writer.completed_jobs_count + 1,
            updated_at: new Date().toISOString(),
          })
          .eq('id', proj.writer_id)
      }
    }

    return NextResponse.json({ message: 'Project approved. Payment released to writer.' })
  } catch (err) {
    return handleAuthError(err)
  }
}
