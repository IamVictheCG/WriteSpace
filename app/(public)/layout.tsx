import Link from 'next/link'

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <span className="text-xl font-bold text-green-700">WriteNaija</span>
            </Link>

            {/* Navigation */}
            <nav className="hidden sm:flex items-center gap-8">
              <Link
                href="/categories"
                className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                Categories
              </Link>
              <Link
                href="/writers"
                className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                Writers
              </Link>
            </nav>

            {/* Auth links */}
            <div className="flex items-center gap-3">
              <Link
                href="/writer/login"
                className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                Writer Login
              </Link>
              <Link
                href="/client/login"
                className="rounded-lg bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800 transition-colors"
              >
                Client Login
              </Link>
            </div>
          </div>
        </div>

        {/* Mobile nav */}
        <div className="sm:hidden border-t border-gray-100">
          <div className="flex gap-4 px-4 py-2">
            <Link
              href="/categories"
              className="text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              Categories
            </Link>
            <Link
              href="/writers"
              className="text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              Writers
            </Link>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div>
              <span className="text-lg font-bold text-green-700">WriteNaija</span>
              <p className="mt-2 text-sm text-gray-500">
                Connecting talented Nigerian writers with clients who need quality content.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">For Writers</h3>
              <ul className="mt-2 space-y-2">
                <li>
                  <Link href="/writer/signup" className="text-sm text-gray-500 hover:text-gray-700">
                    Join as a Writer
                  </Link>
                </li>
                <li>
                  <Link href="/writer/login" className="text-sm text-gray-500 hover:text-gray-700">
                    Writer Login
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">For Clients</h3>
              <ul className="mt-2 space-y-2">
                <li>
                  <Link href="/client/signup" className="text-sm text-gray-500 hover:text-gray-700">
                    Hire a Writer
                  </Link>
                </li>
                <li>
                  <Link href="/client/login" className="text-sm text-gray-500 hover:text-gray-700">
                    Client Login
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t border-gray-200 pt-8 flex flex-col items-center gap-2">
            <Link href="/privacy" className="text-sm text-gray-500 hover:text-gray-700">
              Privacy Policy
            </Link>
            <p className="text-sm text-gray-400">
              &copy; {new Date().getFullYear()} WriteNaija. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
