import { NextResponse } from 'next/server'
import { supabaseService } from '@/lib/supabase/service'
import { createHmac } from 'crypto'

// Verify Paystack webhook signature
function verifyPaystackSignature(body: string, signature: string): boolean {
  const hash = createHmac('sha512', process.env.PAYSTACK_SECRET_KEY!)
    .update(body)
    .digest('hex')
  return hash === signature
}

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('x-paystack-signature')

  if (!signature || !verifyPaystackSignature(body, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const event = JSON.parse(body)

  if (event.event === 'charge.success') {
    const reference = event.data.reference

    // Find the transaction
    const { data: transaction } = await supabaseService
      .from('transactions')
      .select('id, project_id, status')
      .eq('paystack_reference', reference)
      .single()

    if (transaction && transaction.status === 'pending') {
      // Update transaction to held
      await supabaseService
        .from('transactions')
        .update({ status: 'held', updated_at: new Date().toISOString() })
        .eq('id', transaction.id)

      // Update project to active
      await supabaseService
        .from('projects')
        .update({ status: 'active', updated_at: new Date().toISOString() })
        .eq('id', transaction.project_id)
    }
  }

  if (event.event === 'transfer.success') {
    const transferCode = event.data.transfer_code

    // Update payout status
    await supabaseService
      .from('payouts')
      .update({ status: 'completed', processed_at: new Date().toISOString() })
      .eq('paystack_transfer_code', transferCode)
  }

  if (event.event === 'transfer.failed') {
    const transferCode = event.data.transfer_code

    await supabaseService
      .from('payouts')
      .update({ status: 'failed' })
      .eq('paystack_transfer_code', transferCode)
  }

  return NextResponse.json({ received: true })
}
