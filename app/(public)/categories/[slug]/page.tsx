import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getCategoryBySlug } from '@/lib/data/categories'
import { supabaseService } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'

export default async function CategoryDetailPage(
  props: PageProps<'/categories/[slug]'>
) {
  const { slug } = await props.params

  const category = await getCategoryBySlug(slug)
  if (!category) notFound()

  // Fetch writers in this category via the junction table.
  // SECURITY: explicit column list — never select * on writer_profiles for public pages.
  const { data: writerLinks } = await supabaseService
    .from('writer_categories')
    .select(
      `
      writer_id,
      writer_profiles!inner (
        id,
        username,
        bio,
        avatar_url,
        average_rating,
        completed_jobs_count,
        is_verified,
        response_time_hours,
        price_range_min_ngn,
        price_range_max_ngn
      )
    `
    )
    .eq('category_id', category.id)

  const writers =
    writerLinks?.map((link: any) => link.writer_profiles).filter(Boolean) ?? []

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-gray-500">
        <Link href="/categories" className="hover:text-gray-700">
          Categories
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">{category.name}</span>
      </nav>

      {/* Category header */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900">{category.name}</h1>
        {category.description && (
          <p className="mt-2 text-lg text-gray-500">{category.description}</p>
        )}
        <p className="mt-1 text-sm text-gray-400">
          {writers.length} {writers.length === 1 ? 'writer' : 'writers'}{' '}
          available
        </p>
      </div>

      {/* Writers grid */}
      {writers.length === 0 ? (
        <div className="rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-500">
            No writers registered in this category yet.
          </p>
          <Link
            href="/writer/signup"
            className="mt-4 inline-block text-sm font-medium text-green-700 hover:text-green-800"
          >
            Be the first &mdash; join as a writer &rarr;
          </Link>
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
                      <span
                        className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700"
                        title="Verified Writer"
                      >
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
