import { NextResponse } from 'next/server'
import { supabaseService } from '@/lib/supabase/service'
import { requireRole, handleAuthError } from '@/lib/access/require-role'
import { z } from 'zod'

export async function GET() {
  try {
    const auth = await requireRole('client')

    const { data } = await supabaseService
      .from('client_profiles')
      .select('username, contact_email')
      .eq('user_id', auth.userId)
      .single()

    return NextResponse.json(data || {})
  } catch (err) {
    return handleAuthError(err)
  }
}

const updateSchema = z.object({
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_-]+$/),
})

export async function PATCH(request: Request) {
  try {
    const auth = await requireRole('client')
    const body = await request.json()
    const parsed = updateSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid username' }, { status: 400 })
    }

    // Check username uniqueness
    const { data: existing } = await supabaseService
      .from('client_profiles')
      .select('id')
      .eq('username', parsed.data.username)
      .neq('user_id', auth.userId)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Username already taken' }, { status: 409 })
    }

    await supabaseService
      .from('client_profiles')
      .update({ username: parsed.data.username, updated_at: new Date().toISOString() })
      .eq('user_id', auth.userId)

    // Keep user_metadata.username in sync for the layout header
    await supabaseService.auth.admin.updateUserById(auth.userId, {
      user_metadata: { username: parsed.data.username },
    })

    return NextResponse.json({ message: 'Updated' })
  } catch (err) {
    return handleAuthError(err)
  }
}
