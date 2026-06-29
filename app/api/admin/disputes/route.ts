import { NextResponse } from 'next/server'
import { supabaseService } from '@/lib/supabase/service'
import { requireRole, handleAuthError } from '@/lib/access/require-role'
import { z } from 'zod'

export async function GET() {
  try {
    await requireRole('admin')

    const { data: disputes } = await supabaseService
      .from('disputes')
      .select('id, reason, status, created_at, resolved_at, projects!inner(id, title, agreed_price_ngn)')
      .order('created_at', { ascending: false })

    return NextResponse.json(disputes || [])
  } catch (err) {
    return handleAuthError(err)
  }
}

const resolveSchema = z.object({
  dispute_id: z.string().uuid(),
  resolution: z.enum(['resolved_writer', 'resolved_client', 'resolved_partial']),
  resolution_amount_ngn: z.coerce.number().positive().optional(),
  admin_notes: z.string().optional(),
})

export async function PATCH(request: Request) {
  try {
    const auth = await requireRole('admin')
    const body = await request.json()
    const parsed = resolveSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed' }, { status: 400 })
    }

    if (parsed.data.resolution === 'resolved_partial' && !parsed.data.resolution_amount_ngn) {
      return NextResponse.json({ error: 'Partial resolution requires an amount' }, { status: 400 })
    }

    const { data: dispute } = await supabaseService
      .from('disputes')
      .select('id, project_id, status')
      .eq('id', parsed.data.dispute_id)
      .single()

    if (!dispute || dispute.status !== 'open') {
      return NextResponse.json({ error: 'Dispute not found or already resolved' }, { status: 400 })
    }

    // Update dispute
    await supabaseService
      .from('disputes')
      .update({
        status: parsed.data.resolution,
        admin_id: auth.userId,
        admin_notes: parsed.data.admin_notes || null,
        resolution_amount_ngn: parsed.data.resolution_amount_ngn || null,
        resolved_at: new Date().toISOString(),
      })
      .eq('id', parsed.data.dispute_id)

    // Handle transaction based on resolution
    const { data: transaction } = await supabaseService
      .from('transactions')
      .select('id, writer_amount_ngn')
      .eq('project_id', dispute.project_id)
      .eq('status', 'held')
      .single()

    if (transaction) {
      if (parsed.data.resolution === 'resolved_writer') {
        await supabaseService.rpc('release_escrow', { p_transaction_id: transaction.id })
      } else if (parsed.data.resolution === 'resolved_client') {
        await supabaseService
          .from('transactions')
          .update({ status: 'refunded', refunded_at: new Date().toISOString(), updated_at: new Date().toISOString() })
          .eq('id', transaction.id)
      } else {
        await supabaseService
          .from('transactions')
          .update({ status: 'partially_released', updated_at: new Date().toISOString() })
          .eq('id', transaction.id)
      }
    }

    return NextResponse.json({ message: 'Dispute resolved' })
  } catch (err) {
    return handleAuthError(err)
  }
}
