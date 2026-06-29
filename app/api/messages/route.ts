import { NextResponse } from 'next/server'
import { supabaseService } from '@/lib/supabase/service'
import { requireRole, handleAuthError } from '@/lib/access/require-role'
import { messageSchema } from '@/lib/validators/message.schema'
import { scanForContactInfo } from '@/lib/utils/contact-scan'
import { sendFlaggedMessageAlert } from '@/lib/emails/admin-emails'

export async function POST(request: Request) {
  try {
    const auth = await requireRole('writer', 'client')
    const body = await request.json()
    const parsed = messageSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed' }, { status: 400 })
    }

    // Verify user is part of this project
    const { data: project } = await supabaseService
      .from('projects')
      .select('id, client_id, writer_id, client_profiles!inner(user_id), writer_profiles!inner(user_id)')
      .eq('id', parsed.data.project_id)
      .single()

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const clientUserId = (project.client_profiles as unknown as { user_id: string }).user_id
    const writerUserId = (project.writer_profiles as unknown as { user_id: string }).user_id

    if (auth.userId !== clientUserId && auth.userId !== writerUserId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Scan for contact info
    const { flagged, matchedPattern } = scanForContactInfo(parsed.data.content)

    // Insert message (flagged messages still get inserted, just marked)
    const { data: message, error } = await supabaseService
      .from('messages')
      .insert({
        project_id: parsed.data.project_id,
        sender_id: auth.userId,
        content: parsed.data.content,
        is_flagged: flagged,
      })
      .select('id')
      .single()

    if (error || !message) {
      return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
    }

    // If flagged, create flag record and notify admin
    if (flagged && matchedPattern) {
      await supabaseService.from('message_flags').insert({
        message_id: message.id,
        matched_pattern: matchedPattern,
      })

      sendFlaggedMessageAlert(parsed.data.content, matchedPattern).catch(() => {})
    }

    return NextResponse.json({ id: message.id, flagged })
  } catch (err) {
    return handleAuthError(err)
  }
}

export async function GET(request: Request) {
  try {
    const auth = await requireRole('writer', 'client')
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('project_id')

    if (!projectId) {
      return NextResponse.json({ error: 'project_id required' }, { status: 400 })
    }

    // Verify user is part of this project
    const { data: project } = await supabaseService
      .from('projects')
      .select('id, client_id, writer_id, client_profiles!inner(user_id), writer_profiles!inner(user_id)')
      .eq('id', projectId)
      .single()

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const clientUserId = (project.client_profiles as unknown as { user_id: string }).user_id
    const writerUserId = (project.writer_profiles as unknown as { user_id: string }).user_id

    if (auth.userId !== clientUserId && auth.userId !== writerUserId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Return non-flagged messages only
    const { data: messages } = await supabaseService
      .from('messages')
      .select('id, sender_id, content, created_at')
      .eq('project_id', projectId)
      .eq('is_flagged', false)
      .order('created_at', { ascending: true })

    return NextResponse.json(messages || [])
  } catch (err) {
    return handleAuthError(err)
  }
}
