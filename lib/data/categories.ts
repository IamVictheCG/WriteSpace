import { supabaseService } from '@/lib/supabase/service'

export async function getActiveCategories() {
  const { data, error } = await supabaseService
    .from('categories')
    .select('id, name, slug, description')
    .eq('is_active', true)
    .order('name')

  if (error) throw error
  return data
}

export async function getCategoryBySlug(slug: string) {
  const { data, error } = await supabaseService
    .from('categories')
    .select('id, name, slug, description')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (error) return null
  return data
}
