import { NextResponse } from 'next/server'
import { supabaseService } from '@/lib/supabase/service'
import { requireRole, requireOwnership, handleAuthError } from '@/lib/access/require-role'
import { z } from 'zod'

const reviewSchema = z.object({
  project_id: z.string().uuid(),
  rating: z.coerce.number().int().min(1).max(5),
  review_text: z.string().max(2000).optional(),
})

export async function POST(request: Request) {
  try {
    const auth = await requireRole('client')
    const body = await request.json()
    const parsed = reviewSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed' }, { status: 400 })
    }

    await requireOwnership('projects', parsed.data.project_id, 'client_id', auth.profileId!)

    // Verify project is completed
    const { data: project } = await supabaseService
      .from('projects')
      .select('id, status, writer_id')
      .eq('id', parsed.data.project_id)
      .single()

    if (!project || project.status !== 'completed') {
      return NextResponse.json({ error: 'Can only review completed projects' }, { status: 400 })
    }

    // Verify a completed transaction exists
    const { data: transaction } = await supabaseService
      .from('transactions')
      .select('id')
      .eq('project_id', parsed.data.project_id)
      .eq('status', 'released')
      .single()

    if (!transaction) {
      return NextResponse.json({ error: 'No verified completed transaction' }, { status: 400 })
    }

    // Check for existing review
    const { data: existingReview } = await supabaseService
      .from('ratings_reviews')
      .select('id')
      .eq('project_id', parsed.data.project_id)
      .single()

    if (existingReview) {
      return NextResponse.json({ error: 'Already reviewed' }, { status: 409 })
    }

    // Create review
    const { error } = await supabaseService
      .from('ratings_reviews')
      .insert({
        project_id: parsed.data.project_id,
        client_id: auth.profileId,
        writer_id: project.writer_id,
        rating: parsed.data.rating,
        review_text: parsed.data.review_text || null,
      })

    if (error) {
      return NextResponse.json({ error: 'Failed to create review' }, { status: 500 })
    }

    // Recompute writer's average rating
    const { data: ratings } = await supabaseService
      .from('ratings_reviews')
      .select('rating')
      .eq('writer_id', project.writer_id)

    if (ratings && ratings.length > 0) {
      const avg = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
      await supabaseService
        .from('writer_profiles')
        .update({
          average_rating: Math.round(avg * 100) / 100,
          updated_at: new Date().toISOString(),
        })
        .eq('id', project.writer_id)
    }

    return NextResponse.json({ message: 'Review submitted' })
  } catch (err) {
    return handleAuthError(err)
  }
}
