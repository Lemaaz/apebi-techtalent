// src/middleware.ts
// Next.js middleware — must be at src/middleware.ts (or project root middleware.ts)
// Responsibilities:
//   1. Refresh the Supabase auth session cookie on every request (critical for SSR auth)
//   2. Protect private routes at the edge (talent, entreprise, admin)
//   3. Redirect authenticated users away from auth pages

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PROTECTED_TALENT_ROUTES = ['/talent/']
const PROTECTED_RECRUITER_ROUTES = ['/entreprise/']
const PROTECTED_ADMIN_ROUTES = ['/admin', '/admin/']

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  // ── Supabase auth session refresh ─────────────────────────
  // MUST be done in middleware so that cookies are updated on
  // every request and getUser() returns the correct session in
  // Server Components downstream.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // getUser() also refreshes the token if needed and persists updated cookies
  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // ── Route protection ───────────────────────────────────────
  const isProtected =
    PROTECTED_TALENT_ROUTES.some(r => pathname.startsWith(r)) ||
    PROTECTED_RECRUITER_ROUTES.some(r => pathname.startsWith(r)) ||
    PROTECTED_ADMIN_ROUTES.some(r => pathname.startsWith(r))

  if (isProtected && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/connexion'
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  // ── Auth page guard ────────────────────────────────────────
  // Redirect authenticated users away from login/signup pages
  if (user && (pathname === '/connexion' || pathname === '/inscription')) {
    const role = user.user_metadata?.role as string | undefined
    const url = request.nextUrl.clone()
    url.pathname = role === 'entreprise' ? '/entreprise/dashboard' : '/talent/profil'
    return NextResponse.redirect(url)
  }

  // Set x-pathname header so server layouts can read the current path
  supabaseResponse.headers.set('x-pathname', pathname)

  return supabaseResponse
}

export const config = {
  matcher: [
    // Skip Next.js internals, static files, images, and API routes that don't need auth
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
