import { NextResponse } from 'next/server'
import { supabaseService } from '@/lib/supabase/service'
import { requireRole, handleAuthError } from '@/lib/access/require-role'
import { z } from 'zod'

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50 MB
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'image/jpeg',
  'image/png',
  'image/webp',
]

const fileUploadSchema = z.object({
  project_id: z.string().uuid(),
})

export async function POST(request: Request) {
  try {
    const auth = await requireRole('writer')

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const projectId = formData.get('project_id') as string | null

    const parsed = fileUploadSchema.safeParse({ project_id: projectId })
    if (!parsed.success || !file) {
      return NextResponse.json({ error: 'Valid file and project_id required' }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File size exceeds 50 MB limit' }, { status: 400 })
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'File type not allowed' }, { status: 400 })
    }

    // Verify project exists and writer is assigned to it
    const { data: project } = await supabaseService
      .from('projects')
      .select('id, writer_id, status, writer_profiles!inner(user_id)')
      .eq('id', projectId)
      .single()

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const writerUserId = (project.writer_profiles as unknown as { user_id: string }).user_id

    if (auth.userId !== writerUserId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (!['active', 'writer_completed'].includes(project.status)) {
      return NextResponse.json({ error: 'Cannot upload files in current project state' }, { status: 400 })
    }

    const filePath = `projects/${projectId}/${Date.now()}_${file.name}`
    const { error: uploadError } = await supabaseService.storage
      .from('project-files')
      .upload(filePath, file)

    if (uploadError) {
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
    }

    const { data: fileRecord, error: dbError } = await supabaseService
      .from('project_files')
      .insert({
        project_id: projectId,
        uploaded_by: auth.userId,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        mime_type: file.type,
      })
      .select('id')
      .single()

    if (dbError) {
      return NextResponse.json({ error: 'Failed to record file' }, { status: 500 })
    }

    return NextResponse.json({ id: fileRecord?.id, message: 'File uploaded' })
  } catch (err) {
    return handleAuthError(err)
  }
}
