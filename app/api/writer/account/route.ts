import { NextResponse } from 'next/server'
import { supabaseService } from '@/lib/supabase/service'
import { requireRole, handleAuthError } from '@/lib/access/require-role'
import { z } from 'zod'

export async function GET() {
  try {
    const auth = await requireRole('writer')

    // Writer's own account page — one of two places where bank fields are allowed
    const { data } = await supabaseService
      .from('writer_profiles')
      .select('id, username, full_name, bio, response_time_hours, price_range_min_ngn, price_range_max_ngn, bank_name, bank_account_number, bank_account_name, is_verified')
      .eq('user_id', auth.userId)
      .single()

    if (!data) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const [writerCatsResult, allCatsResult] = await Promise.all([
      supabaseService
        .from('writer_categories')
        .select('category_id')
        .eq('writer_id', data.id),
      supabaseService
        .from('categories')
        .select('id, name, slug')
        .eq('is_active', true)
        .order('name'),
    ])

    return NextResponse.json({
      profile: data,
      writerCategoryIds: (writerCatsResult.data ?? []).map((wc) => wc.category_id),
      allCategories: allCatsResult.data ?? [],
    })
  } catch (err) {
    return handleAuthError(err)
  }
}

const updateSchema = z.object({
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_-]+$/),
  full_name: z.string().min(2),
  bio: z.string().max(500).optional(),
  response_time_hours: z.number().int().min(1).max(48),
  price_range_min_ngn: z.number().positive(),
  price_range_max_ngn: z.number().positive(),
  bank_name: z.string().min(1),
  bank_account_number: z.string().length(10).regex(/^\d+$/),
  bank_account_name: z.string().min(1),
  category_ids: z.array(z.string().uuid()).min(1),
})

export async function PUT(request: Request) {
  try {
    const auth = await requireRole('writer')
    const body = await request.json()
    const parsed = updateSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { category_ids, ...profileFields } = parsed.data

    if (profileFields.price_range_max_ngn < profileFields.price_range_min_ngn) {
      return NextResponse.json({ error: 'Max price must be greater than or equal to min price' }, { status: 400 })
    }

    // Check username uniqueness (excluding current user)
    const { data: existing } = await supabaseService
      .from('writer_profiles')
      .select('id')
      .eq('username', profileFields.username)
      .neq('user_id', auth.userId)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Username already taken' }, { status: 409 })
    }

    // Validate against platform settings
    const { data: settings } = await supabaseService
      .from('platform_settings')
      .select('key, value')
      .in('key', ['min_writer_price_ngn', 'max_writer_price_ngn', 'max_writer_response_time_hours'])

    if (settings) {
      const settingsMap = Object.fromEntries(settings.map(s => [s.key, Number(s.value)]))
      if (profileFields.price_range_min_ngn < (settingsMap.min_writer_price_ngn || 0)) {
        return NextResponse.json({ error: `Minimum price cannot be below ₦${settingsMap.min_writer_price_ngn}` }, { status: 400 })
      }
      if (profileFields.price_range_max_ngn > (settingsMap.max_writer_price_ngn || Infinity)) {
        return NextResponse.json({ error: `Maximum price cannot exceed ₦${settingsMap.max_writer_price_ngn}` }, { status: 400 })
      }
      if (profileFields.response_time_hours > (settingsMap.max_writer_response_time_hours || 48)) {
        return NextResponse.json({ error: `Response time cannot exceed ${settingsMap.max_writer_response_time_hours} hours` }, { status: 400 })
      }
    }

    // Update profile
    const { error: updateError } = await supabaseService
      .from('writer_profiles')
      .update({ ...profileFields, updated_at: new Date().toISOString() })
      .eq('user_id', auth.userId)

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }

    // Keep user_metadata.username in sync for the layout header
    await supabaseService.auth.admin.updateUserById(auth.userId, {
      user_metadata: { username: profileFields.username },
    })

    // Update categories: delete old, insert new
    const { data: profile } = await supabaseService
      .from('writer_profiles')
      .select('id')
      .eq('user_id', auth.userId)
      .single()

    if (profile) {
      await supabaseService
        .from('writer_categories')
        .delete()
        .eq('writer_id', profile.id)

      const categoryLinks = category_ids.map(categoryId => ({
        writer_id: profile.id,
        category_id: categoryId,
      }))

      await supabaseService.from('writer_categories').insert(categoryLinks)
    }

    return NextResponse.json({ message: 'Profile updated' })
  } catch (err) {
    return handleAuthError(err)
  }
}
