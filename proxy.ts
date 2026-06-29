import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// Thin proxy: checks if a session cookie exists and redirects to the
// right /login if not. No role checks, no database calls, no JWT validation.
// Role checks and ownership checks happen in require-role.ts.

export async function proxy(request: NextRequest) {
  const response = NextResponse.next({ request })
  const path = request.nextUrl.pathname

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Refresh the session so it doesn't expire
  const { data: { user } } = await supabase.auth.getUser()

  // Writer routes require a session — redirect to writer login
  if (path.startsWith('/writer') && !path.startsWith('/writer/login') && !path.startsWith('/writer/signup')) {
    if (!user) {
      return NextResponse.redirect(new URL('/writer/login', request.url))
    }
  }

  // Client routes require a session — redirect to client login
  if (path.startsWith('/client') && !path.startsWith('/client/login') && !path.startsWith('/client/signup')) {
    if (!user) {
      return NextResponse.redirect(new URL('/client/login', request.url))
    }
  }

  // Admin routes require a session — redirect to admin login
  if (path.startsWith('/admin') && !path.startsWith('/admin/login')) {
    if (!user) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }

  // Supabase allows only one session per browser per domain.
  // Testing writer and client flows simultaneously requires separate browser profiles.

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
