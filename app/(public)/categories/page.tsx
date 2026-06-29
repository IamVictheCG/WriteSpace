import Link from 'next/link'
import { getActiveCategories } from '@/lib/data/categories'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Categories — WriteNaija',
  description: 'Browse writing categories and find specialized writers.',
}

export default async function CategoriesPage() {
  const categories = await getActiveCategories()

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900">
          Writing Categories
        </h1>
        <p className="mt-2 text-lg text-gray-500">
          Explore our categories and find writers who specialize in the content
          you need.
        </p>
      </div>

      {categories.length === 0 ? (
        <p className="text-gray-500">No categories available at the moment.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/categories/${category.slug}`}
              className="group block rounded-xl border border-gray-200 p-6 hover:border-green-300 hover:shadow-lg transition-all"
            >
              <h2 className="text-xl font-semibold text-gray-900 group-hover:text-green-700 transition-colors">
                {category.name}
              </h2>
              <p className="mt-1 text-sm text-gray-400">{category.slug}</p>
              {category.description && (
                <p className="mt-3 text-gray-600">{category.description}</p>
              )}
              <span className="mt-4 inline-block text-sm font-medium text-green-700">
                View writers &rarr;
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
