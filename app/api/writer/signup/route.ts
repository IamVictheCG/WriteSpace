import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseService } from '@/lib/supabase/service'
import { writerSignupSchema } from '@/lib/validators/writer-signup.schema'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = writerSignupSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { email, password, username, full_name, bio, response_time_hours, price_range_min_ngn, price_range_max_ngn, bank_name, bank_account_number, bank_account_name, category_ids } = parsed.data

    // Check username uniqueness
    const { data: existing } = await supabaseService
      .from('writer_profiles')
      .select('id')
      .eq('username', username)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Username already taken' }, { status: 409 })
    }

    // Validate price ranges against platform settings
    const { data: settings } = await supabaseService
      .from('platform_settings')
      .select('key, value')
      .in('key', ['min_writer_price_ngn', 'max_writer_price_ngn', 'max_writer_response_time_hours'])

    if (settings) {
      const settingsMap = Object.fromEntries(settings.map(s => [s.key, Number(s.value)]))
      if (price_range_min_ngn < (settingsMap.min_writer_price_ngn || 0)) {
        return NextResponse.json({ error: `Minimum price cannot be below ₦${settingsMap.min_writer_price_ngn}` }, { status: 400 })
      }
      if (price_range_max_ngn > (settingsMap.max_writer_price_ngn || Infinity)) {
        return NextResponse.json({ error: `Maximum price cannot exceed ₦${settingsMap.max_writer_price_ngn}` }, { status: 400 })
      }
      if (response_time_hours > (settingsMap.max_writer_response_time_hours || 48)) {
        return NextResponse.json({ error: `Response time cannot exceed ${settingsMap.max_writer_response_time_hours} hours` }, { status: 400 })
      }
    }

    // Create auth user
    const supabase = await createClient()
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { role: 'writer' },
      },
    })

    if (authError || !authData.user) {
      return NextResponse.json({ error: authError?.message ?? 'Signup failed' }, { status: 400 })
    }

    // Create writer profile
    const { error: profileError } = await supabaseService
      .from('writer_profiles')
      .insert({
        user_id: authData.user.id,
        username,
        full_name,
        bio: bio || null,
        response_time_hours,
        price_range_min_ngn,
        price_range_max_ngn,
        bank_name,
        bank_account_number,
        bank_account_name,
      })

    if (profileError) {
      return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 })
    }

    // Get the created profile ID
    const { data: profile } = await supabaseService
      .from('writer_profiles')
      .select('id')
      .eq('user_id', authData.user.id)
      .single()

    // Link categories
    if (profile) {
      const categoryLinks = category_ids.map(categoryId => ({
        writer_id: profile.id,
        category_id: categoryId,
      }))

      await supabaseService.from('writer_categories').insert(categoryLinks)

      // Create wallet for writer
      await supabaseService.from('wallets').insert({ writer_id: profile.id })
    }

    return NextResponse.json({ message: 'Signup successful. Please check your email to verify your account.' })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
