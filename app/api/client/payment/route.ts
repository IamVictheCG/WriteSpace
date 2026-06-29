import { NextResponse } from 'next/server'
import { supabaseService } from '@/lib/supabase/service'
import { requireRole, requireOwnership, handleAuthError } from '@/lib/access/require-role'
import { calculateCommission } from '@/lib/utils/escrow-status'
import { z } from 'zod'

const paymentSchema = z.object({
  project_id: z.string().uuid(),
})

export async function POST(request: Request) {
  try {
    const auth = await requireRole('client')
    const body = await request.json()
    const parsed = paymentSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed' }, { status: 400 })
    }

    await requireOwnership('projects', parsed.data.project_id, 'client_id', auth.profileId!)

    const { data: project } = await supabaseService
      .from('projects')
      .select('id, agreed_price_ngn, writer_id, status')
      .eq('id', parsed.data.project_id)
      .single()

    if (!project || project.status !== 'awaiting_payment') {
      return NextResponse.json({ error: 'Project not found or not awaiting payment' }, { status: 400 })
    }

    // Get commission rate
    const { data: setting } = await supabaseService
      .from('platform_settings')
      .select('value')
      .eq('key', 'commission_rate')
      .single()

    const commissionRate = Number(setting?.value || 0.15)
    const amounts = calculateCommission(project.agreed_price_ngn, commissionRate)

    // Initialize Paystack transaction
    // In production, this calls Paystack's initialize transaction API
    const paystackReference = `wm_${project.id}_${Date.now()}`

    // Create escrow transaction record
    const { error: txError } = await supabaseService
      .from('transactions')
      .insert({
        project_id: project.id,
        client_id: auth.profileId,
        writer_id: project.writer_id,
        amount_ngn: project.agreed_price_ngn,
        commission_rate: commissionRate,
        commission_amount_ngn: amounts.commission_amount_ngn,
        writer_amount_ngn: amounts.writer_amount_ngn,
        status: 'pending',
        paystack_reference: paystackReference,
      })

    if (txError) {
      return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 })
    }

    // In production: return Paystack authorization URL
    return NextResponse.json({
      authorization_url: `https://checkout.paystack.com/${paystackReference}`,
      reference: paystackReference,
    })
  } catch (err) {
    return handleAuthError(err)
  }
}
