import Link from 'next/link'
import { notFound } from 'next/navigation'
import { supabaseService } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'

export default async function WriterProfilePage(
  props: PageProps<'/writers/[id]'>
) {
  const { id } = await props.params

  // SECURITY: explicit column list — never select * on writer_profiles for public pages.
  const { data: writer } = await supabaseService
    .from('writer_profiles')
    .select(
      'id, username, bio, avatar_url, response_time_hours, price_range_min_ngn, price_range_max_ngn, completed_jobs_count, average_rating, is_verified, verified_at'
    )
    .eq('id', id)
    .single()

  if (!writer) notFound()

  // Fetch categories via junction table
  const { data: writerCats } = await supabaseService
    .from('writer_categories')
    .select(
      `
      category_id,
      categories!inner (
        id, name, slug
      )
    `
    )
    .eq('writer_id', writer.id)

  const categories =
    writerCats?.map((wc: any) => wc.categories).filter(Boolean) ?? []

  // Fetch portfolio samples
  const { data: portfolio } = await supabaseService
    .from('portfolio_samples')
    .select('id, title, description, external_url, file_url, display_order')
    .eq('writer_id', writer.id)
    .order('display_order', { ascending: true })

  // Fetch ratings/reviews
  const { data: reviews } = await supabaseService
    .from('ratings_reviews')
    .select(
      `
      id,
      rating,
      review_text,
      created_at,
      client_profiles!inner (
        username
      )
    `
    )
    .eq('writer_id', writer.id)
    .order('created_at', { ascending: false })

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-gray-500">
        <Link href="/writers" className="hover:text-gray-700">
          Writers
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">{writer.username}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main profile info */}
        <div className="lg:col-span-2 space-y-8">
          {/* Profile header */}
          <div className="rounded-xl border border-gray-200 p-8">
            <div className="flex items-start gap-6">
              {writer.avatar_url ? (
                <img
                  src={writer.avatar_url}
                  alt={writer.username}
                  className="h-20 w-20 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-green-700 font-bold text-3xl">
                  {writer.username.charAt(0).toUpperCase()}
                </div>
              )}

              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {writer.username}
                  </h1>
                  {writer.is_verified && (
                    <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                      Verified
                    </span>
                  )}
                </div>

                {writer.bio && (
                  <p className="mt-3 text-gray-600 whitespace-pre-line">
                    {writer.bio}
                  </p>
                )}

                {/* Categories */}
                {categories.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {categories.map((cat: any) => (
                      <Link
                        key={cat.id}
                        href={`/categories/${cat.slug}`}
                        className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700 hover:bg-gray-200 transition-colors"
                      >
                        {cat.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Portfolio */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Portfolio</h2>
            {portfolio && portfolio.length > 0 ? (
              <div className="space-y-4">
                {portfolio.map((sample: any) => (
                  <div
                    key={sample.id}
                    className="rounded-xl border border-gray-200 p-6"
                  >
                    <h3 className="text-lg font-semibold text-gray-900">
                      {sample.title}
                    </h3>
                    {sample.description && (
                      <p className="mt-2 text-gray-600">
                        {sample.description}
                      </p>
                    )}
                    <div className="mt-3 flex gap-4">
                      {sample.external_url && (
                        <a
                          href={sample.external_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-green-700 hover:text-green-800"
                        >
                          View published work &rarr;
                        </a>
                      )}
                      {sample.file_url && (
                        <a
                          href={sample.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-green-700 hover:text-green-800"
                        >
                          Download sample &rarr;
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-gray-200 p-8 text-center">
                <p className="text-gray-500">
                  No portfolio samples added yet.
                </p>
              </div>
            )}
          </div>

          {/* Reviews */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Reviews
              {reviews && reviews.length > 0 && (
                <span className="ml-2 text-base font-normal text-gray-500">
                  ({reviews.length})
                </span>
              )}
            </h2>
            {reviews && reviews.length > 0 ? (
              <div className="space-y-4">
                {reviews.map((review: any) => (
                  <div
                    key={review.id}
                    className="rounded-xl border border-gray-200 p-6"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">
                          {review.client_profiles?.username ?? 'Client'}
                        </span>
                        <RatingStars rating={review.rating} />
                      </div>
                      <span className="text-sm text-gray-400">
                        {new Date(review.created_at).toLocaleDateString(
                          'en-NG',
                          {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          }
                        )}
                      </span>
                    </div>
                    {review.review_text && (
                      <p className="mt-3 text-gray-600">
                        {review.review_text}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-gray-200 p-8 text-center">
                <p className="text-gray-500">No reviews yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Stats card */}
          <div className="rounded-xl border border-gray-200 p-6 sticky top-24">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Writer Details
            </h2>

            <dl className="space-y-4">
              <div>
                <dt className="text-sm text-gray-500">Rating</dt>
                <dd className="mt-1 text-lg font-semibold text-gray-900">
                  {writer.average_rating !== null
                    ? `${writer.average_rating.toFixed(1)} / 5.0`
                    : 'No ratings yet'}
                </dd>
              </div>

              <div>
                <dt className="text-sm text-gray-500">Jobs Completed</dt>
                <dd className="mt-1 text-lg font-semibold text-gray-900">
                  {writer.completed_jobs_count}
                </dd>
              </div>

              <div>
                <dt className="text-sm text-gray-500">Response Time</dt>
                <dd className="mt-1 text-lg font-semibold text-gray-900">
                  {writer.response_time_hours}{' '}
                  {writer.response_time_hours === 1 ? 'hour' : 'hours'}
                </dd>
              </div>

              <div>
                <dt className="text-sm text-gray-500">Price Range</dt>
                <dd className="mt-1 text-lg font-semibold text-green-700">
                  {formatPrice(writer.price_range_min_ngn)} &ndash;{' '}
                  {formatPrice(writer.price_range_max_ngn)}
                </dd>
              </div>

              {writer.is_verified && writer.verified_at && (
                <div>
                  <dt className="text-sm text-gray-500">Verified Since</dt>
                  <dd className="mt-1 text-sm font-medium text-gray-900">
                    {new Date(writer.verified_at).toLocaleDateString('en-NG', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </dd>
                </div>
              )}
            </dl>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <Link
                href="/client/login"
                className="block w-full rounded-lg bg-green-700 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-green-800 transition-colors"
              >
                Start a Project
              </Link>
              <p className="mt-2 text-xs text-gray-400 text-center">
                Sign in as a client to start a project with this writer
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`h-4 w-4 ${
            star <= rating ? 'text-yellow-400' : 'text-gray-200'
          }`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  )
}

function formatPrice(amount: number): string {
  return `₦${amount.toLocaleString()}`
}
