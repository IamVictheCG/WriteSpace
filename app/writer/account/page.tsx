import { requireRole } from '@/lib/access/require-role'
import { supabaseService } from '@/lib/supabase/service'
import { AccountForm } from './account-form'

export default async function WriterAccountPage() {
  const auth = await requireRole('writer')

  // Fetch writer profile
  const { data: profile } = await supabaseService
    .from('writer_profiles')
    .select('id, username, full_name, bio, response_time_hours, price_range_min_ngn, price_range_max_ngn, bank_name, bank_account_number, bank_account_name, is_verified')
    .eq('user_id', auth.userId)
    .single()

  if (!profile) {
    return (
      <div className="rounded-lg bg-red-50 p-6 text-red-700">
        Writer profile not found. Please contact support.
      </div>
    )
  }

  // Fetch writer's categories and all active categories
  const [writerCatsResult, allCatsResult] = await Promise.all([
    supabaseService
      .from('writer_categories')
      .select('category_id, categories(id, name)')
      .eq('writer_id', profile.id),

    supabaseService
      .from('categories')
      .select('id, name, slug')
      .eq('is_active', true)
      .order('name'),
  ])

  const writerCategoryIds = (writerCatsResult.data ?? []).map((wc) => wc.category_id)
  const allCategories = allCatsResult.data ?? []

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
        <p className="mt-1 text-sm text-gray-600">
          Manage your profile, categories, and bank details
        </p>
      </div>

      <AccountForm
        profile={profile}
        allCategories={allCategories}
        writerCategoryIds={writerCategoryIds}
      />
    </div>
  )
}
