import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Handles token_hash + type, not action_link.
// Supabase email verification and password reset flow.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const next = searchParams.get('next') ?? '/'

  if (token_hash && type) {
    const supabase = await createClient()
    const { error } = await supabase.auth.verifyOtp({
      type: type as 'signup' | 'recovery' | 'email',
      token_hash,
    })

    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()
      const role = user?.user_metadata?.role

      if (role === 'writer') {
        return NextResponse.redirect(new URL('/writer/dashboard', request.url))
      } else if (role === 'client') {
        return NextResponse.redirect(new URL('/client/dashboard', request.url))
      }
      return NextResponse.redirect(new URL(next, request.url))
    }
  }

  return NextResponse.redirect(new URL('/?error=auth', request.url))
}
