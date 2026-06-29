import Link from 'next/link'
import { getActiveCategories } from '@/lib/data/categories'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'WriteNaija — Connect with Nigerian Writers',
  description:
    'Find talented Nigerian writers for ghostwriting, copywriting, technical writing, and more. Post a job or browse writer profiles.',
}

export default async function LandingPage() {
  const categories = await getActiveCategories()

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-linear-to-br from-green-700 via-green-800 to-green-900 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
              Quality Writing,
              <br />
              <span className="text-green-300">Nigerian Talent</span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-green-100 max-w-2xl mx-auto">
              WriteNaija connects you with skilled Nigerian writers for any
              content need. From ghostwriting to technical documentation, find
              the perfect writer for your project.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/client/signup"
                className="w-full sm:w-auto rounded-lg bg-white px-8 py-3 text-base font-semibold text-green-800 shadow-sm hover:bg-green-50 transition-colors"
              >
                Hire a Writer
              </Link>
              <Link
                href="/writer/signup"
                className="w-full sm:w-auto rounded-lg border-2 border-white px-8 py-3 text-base font-semibold text-white hover:bg-white/10 transition-colors"
              >
                Join as a Writer
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">How It Works</h2>
            <p className="mt-3 text-lg text-gray-500">
              Get started in three simple steps
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-12">
            {/* Step 1 */}
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-700">
                <span className="text-2xl font-bold">1</span>
              </div>
              <h3 className="mt-6 text-lg font-semibold text-gray-900">
                Post Your Job
              </h3>
              <p className="mt-2 text-gray-500">
                Describe your project, set a budget, and choose a category.
                Writers will see your posting and respond with proposals.
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-700">
                <span className="text-2xl font-bold">2</span>
              </div>
              <h3 className="mt-6 text-lg font-semibold text-gray-900">
                Choose a Writer
              </h3>
              <p className="mt-2 text-gray-500">
                Review proposals, check portfolios and ratings, then select the
                writer that fits your needs. Pay securely through escrow.
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-700">
                <span className="text-2xl font-bold">3</span>
              </div>
              <h3 className="mt-6 text-lg font-semibold text-gray-900">
                Get Your Content
              </h3>
              <p className="mt-2 text-gray-500">
                Collaborate with your writer, review the deliverables, and
                approve the work. Payment is released only when you are
                satisfied.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">
              Browse Categories
            </h2>
            <p className="mt-3 text-lg text-gray-500">
              Find writers specializing in the content you need
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/categories/${category.slug}`}
                className="group rounded-xl border border-gray-200 p-6 hover:border-green-300 hover:shadow-md transition-all"
              >
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-green-700 transition-colors">
                  {category.name}
                </h3>
                {category.description && (
                  <p className="mt-2 text-sm text-gray-500 line-clamp-2">
                    {category.description}
                  </p>
                )}
                <span className="mt-4 inline-block text-sm font-medium text-green-700">
                  Browse writers &rarr;
                </span>
              </Link>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link
              href="/categories"
              className="text-sm font-semibold text-green-700 hover:text-green-800"
            >
              View all categories &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-green-700 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white">
            Ready to get started?
          </h2>
          <p className="mt-4 text-lg text-green-100 max-w-xl mx-auto">
            Whether you are a writer looking for opportunities or a client in
            need of quality content, WriteNaija has you covered.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/writer/signup"
              className="w-full sm:w-auto rounded-lg bg-white px-8 py-3 text-base font-semibold text-green-800 hover:bg-green-50 transition-colors"
            >
              Join as a Writer
            </Link>
            <Link
              href="/client/signup"
              className="w-full sm:w-auto rounded-lg border-2 border-white px-8 py-3 text-base font-semibold text-white hover:bg-white/10 transition-colors"
            >
              Hire a Writer
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
