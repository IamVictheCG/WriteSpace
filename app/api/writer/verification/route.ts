import { NextResponse } from 'next/server'
import { supabaseService } from '@/lib/supabase/service'
import { requireRole, handleAuthError } from '@/lib/access/require-role'

export async function POST() {
  try {
    const auth = await requireRole('writer')

    if (!auth.profileId) {
      return NextResponse.json({ error: 'Writer profile not found' }, { status: 404 })
    }

    // Check if writer is already verified
    const { data: profile } = await supabaseService
      .from('writer_profiles')
      .select('is_verified')
      .eq('id', auth.profileId)
      .single()

    if (profile?.is_verified) {
      return NextResponse.json({ error: 'You are already verified' }, { status: 400 })
    }

    // Check for existing pending application
    const { data: existingApp } = await supabaseService
      .from('badge_applications')
      .select('id, status')
      .eq('writer_id', auth.profileId)
      .eq('status', 'pending')
      .single()

    if (existingApp) {
      return NextResponse.json({ error: 'You already have a pending verification request' }, { status: 409 })
    }

    const { error } = await supabaseService
      .from('badge_applications')
      .insert({
        writer_id: auth.profileId,
        portfolio_notes: 'Verification requested via account page',
        status: 'pending',
        submitted_at: new Date().toISOString(),
      })

    if (error) {
      return NextResponse.json({ error: 'Failed to submit verification request' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Verification request submitted' })
  } catch (err) {
    return handleAuthError(err)
  }
}
