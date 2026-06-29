import { createClient } from '@/lib/supabase/server'
import { supabaseService } from '@/lib/supabase/service'

export type Role = 'writer' | 'client' | 'admin'

interface AuthResult {
  userId: string
  role: Role
  profileId: string | null
}

export async function requireRole(...allowedRoles: Role[]): Promise<AuthResult> {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    throw new AuthError('Not authenticated', 401)
  }

  const role = user.user_metadata?.role as Role | undefined

  if (!role || !allowedRoles.includes(role)) {
    throw new AuthError('Forbidden', 403)
  }

  let profileId: string | null = null

  if (role === 'writer') {
    const { data } = await supabaseService
      .from('writer_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()
    profileId = data?.id ?? null
  } else if (role === 'client') {
    const { data } = await supabaseService
      .from('client_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()
    profileId = data?.id ?? null
  }

  return { userId: user.id, role, profileId }
}

export async function requireOwnership(
  table: string,
  recordId: string,
  ownerColumn: string,
  expectedOwnerId: string
): Promise<void> {
  const { data, error } = await supabaseService
    .from(table)
    .select(ownerColumn)
    .eq('id', recordId)
    .single()

  if (error || !data) {
    throw new AuthError('Resource not found', 404)
  }

  if ((data as unknown as Record<string, unknown>)[ownerColumn] !== expectedOwnerId) {
    throw new AuthError('Forbidden', 403)
  }
}

export class AuthError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'AuthError'
    this.status = status
  }
}

export function handleAuthError(err: unknown): Response {
  if (err instanceof AuthError) {
    return Response.json({ error: err.message }, { status: err.status })
  }
  return Response.json({ error: 'Internal server error' }, { status: 500 })
}
