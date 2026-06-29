import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseService } from '@/lib/supabase/service'
import { clientSignupSchema } from '@/lib/validators/client-signup.schema'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = clientSignupSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { email, password, username } = parsed.data

    // Check username uniqueness
    const { data: existing } = await supabaseService
      .from('client_profiles')
      .select('id')
      .eq('username', username)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Username already taken' }, { status: 409 })
    }

    const supabase = await createClient()
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { role: 'client' },
      },
    })

    if (authError || !authData.user) {
      return NextResponse.json({ error: authError?.message ?? 'Signup failed' }, { status: 400 })
    }

    const { error: profileError } = await supabaseService
      .from('client_profiles')
      .insert({
        user_id: authData.user.id,
        username,
        contact_email: email,
      })

    if (profileError) {
      return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Signup successful. Please check your email to verify your account.' })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
