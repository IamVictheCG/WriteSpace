import Link from 'next/link'
import { supabaseService } from '@/lib/supabase/service'
import { getActiveCategories } from '@/lib/data/categories'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Writers — WriteNaija',
  description: 'Browse our directory of talented Nigerian writers.',
}

// SECURITY: explicit column list — never select * on writer_profiles for public pages.
const WRITER_PUBLIC_COLUMNS =
  'id, username, bio, avatar_url, average_rating, completed_jobs_count, is_verified, response_time_hours, price_range_min_ngn, price_range_max_ngn'

export default async function WritersDirectoryPage(
  props: PageProps<'/writers'>
) {
  const searchParams = await props.searchParams
  const categoryFilter =
    typeof searchParams.category === 'string' ? searchParams.category : ''

  const categories = await getActiveCategories()

  let writers: any[] = []

  if (categoryFilter) {
    // Find writers by category via junction table
    const matchedCategory = categories.find(
      (c) => c.slug === categoryFilter
    )

    if (matchedCategory) {
      const { data: writerLinks } = await supabaseService
        .from('writer_categories')
        .select(
          `
          writer_id,
          writer_profiles!inner (
            ${WRITER_PUBLIC_COLUMNS}
          )
        `
        )
        .eq('category_id', matchedCategory.id)

      writers =
        writerLinks
          ?.map((link: any) => link.writer_profiles)
          .filter(Boolean) ?? []
    }
  } else {
    // Fetch all writers
    const { data } = await supabaseService
      .from('writer_profiles')
      .select(WRITER_PUBLIC_COLUMNS)
      .order('completed_jobs_count', { ascending: false })

    writers = data ?? []
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900">Writer Directory</h1>
        <p className="mt-2 text-lg text-gray-500">
          Browse talented writers and find the right fit for your project.
        </p>
      </div>

      {/* Category filter */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-2">
          <Link
            href="/writers"
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              !categoryFilter
                ? 'bg-green-700 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/writers?category=${cat.slug}`}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                categoryFilter === cat.slug
                  ? 'bg-green-700 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {cat.name}
            </Link>
          ))}
        </div>
      </div>

      {/* Writers grid */}
      {writers.length === 0 ? (
        <div className="rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-500">
            {categoryFilter
              ? 'No writers found in this category.'
              : 'No writers registered yet.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {writers.map((writer: any) => (
            <Link
              key={writer.id}
              href={`/writers/${writer.id}`}
              className="group block rounded-xl border border-gray-200 p-6 hover:border-green-300 hover:shadow-lg transition-all"
            >
              <div className="flex items-start gap-4">
                {/* Avatar */}
                {writer.avatar_url ? (
                  <img
                    src={writer.avatar_url}
                    alt={writer.username}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-700 font-semibold text-lg">
                    {writer.username.charAt(0).toUpperCase()}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-green-700 transition-colors truncate">
                      {writer.username}
                    </h3>
                    {writer.is_verified && (
                      <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                        Verified
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {writer.bio && (
                <p className="mt-3 text-sm text-gray-600 line-clamp-2">
                  {writer.bio}
                </p>
              )}

              <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                {writer.average_rating !== null && (
                  <span>
                    {writer.average_rating.toFixed(1)} / 5.0 rating
                  </span>
                )}
                <span>{writer.completed_jobs_count} jobs completed</span>
                <span>Responds in {writer.response_time_hours}h</span>
              </div>

              <div className="mt-3 text-sm font-medium text-green-700">
                {formatPrice(writer.price_range_min_ngn)} &ndash;{' '}
                {formatPrice(writer.price_range_max_ngn)}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

function formatPrice(amount: number): string {
  return `₦${amount.toLocaleString()}`
}
