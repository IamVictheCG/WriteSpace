import { NextResponse } from 'next/server'
import { supabaseService } from '@/lib/supabase/service'
import { requireRole, handleAuthError } from '@/lib/access/require-role'
import { z } from 'zod'

const withdrawSchema = z.object({
  amount_ngn: z.coerce.number().positive('Amount must be positive'),
})

export async function POST(request: Request) {
  try {
    const auth = await requireRole('writer')
    const body = await request.json()
    const parsed = withdrawSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed' }, { status: 400 })
    }

    // Use the database function for atomic withdrawal
    const { data, error } = await supabaseService.rpc('process_withdrawal', {
      p_writer_id: auth.profileId,
      p_amount_ngn: parsed.data.amount_ngn,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ payout_id: data, message: 'Withdrawal requested' })
  } catch (err) {
    return handleAuthError(err)
  }
}

export async function GET(request: Request) {
  try {
    const auth = await requireRole('writer')

    const { data: wallet } = await supabaseService
      .from('wallets')
      .select('balance_ngn, total_earned_ngn, total_withdrawn_ngn')
      .eq('writer_id', auth.profileId!)
      .single()

    const { data: payouts } = await supabaseService
      .from('payouts')
      .select('id, amount_ngn, status, requested_at, processed_at')
      .eq('writer_id', auth.profileId!)
      .order('requested_at', { ascending: false })

    return NextResponse.json({ wallet, payouts: payouts || [] })
  } catch (err) {
    return handleAuthError(err)
  }
}
