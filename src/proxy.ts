import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Trailing slash ensures /entreprises (public) is never caught by /entreprise (private)
const PROTECTED_TALENT_ROUTES = ['/talent/']
const PROTECTED_RECRUITER_ROUTES = ['/entreprise/']
const PROTECTED_ADMIN_ROUTES = ['/admin', '/admin/']

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

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

  // getUser() refreshes the token if needed and persists updated cookies
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
  if (user && (pathname === '/connexion' || pathname === '/inscription')) {
    const role = user.user_metadata?.role as string | undefined
    const url = request.nextUrl.clone()
    url.pathname = role === 'entreprise' ? '/entreprise/dashboard' : '/talent/dashboard'
    return NextResponse.redirect(url)
  }

  // Set x-pathname header so server layouts can read the current path
  supabaseResponse.headers.set('x-pathname', pathname)

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
