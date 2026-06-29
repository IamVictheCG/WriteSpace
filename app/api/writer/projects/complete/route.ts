import { NextResponse } from 'next/server'
import { supabaseService } from '@/lib/supabase/service'
import { requireRole, requireOwnership, handleAuthError } from '@/lib/access/require-role'
import { z } from 'zod'

const completeSchema = z.object({
  project_id: z.string().uuid(),
})

export async function POST(request: Request) {
  try {
    const auth = await requireRole('writer')
    const body = await request.json()
    const parsed = completeSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed' }, { status: 400 })
    }

    await requireOwnership('projects', parsed.data.project_id, 'writer_id', auth.profileId!)

    const { data: project } = await supabaseService
      .from('projects')
      .select('id, status')
      .eq('id', parsed.data.project_id)
      .single()

    if (!project || project.status !== 'active') {
      return NextResponse.json({ error: 'Project not found or not active' }, { status: 400 })
    }

    await supabaseService
      .from('projects')
      .update({
        status: 'writer_completed',
        writer_completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', parsed.data.project_id)

    return NextResponse.json({ message: 'Project marked as complete. Waiting for client approval.' })
  } catch (err) {
    return handleAuthError(err)
  }
}
