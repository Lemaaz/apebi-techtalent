import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Trailing slash ensures /entreprises (public) is never caught by /entreprise (private)
const PROTECTED_TALENT_ROUTES = ['/talent/']
const PROTECTED_RECRUITER_ROUTES = ['/entreprise/']
const PROTECTED_ADMIN_ROUTES = ['/admin', '/admin/']

// ── Rate limiter — sliding window in-memory ──────────────────────────────────
// Per Edge instance (stateless). Sufficient for MVP traffic.
// Upgrade to Upstash Redis for multi-region enforcement if needed.

type WindowEntry = { count: number; resetAt: number }
const _rateWindows = new Map<string, WindowEntry>()

const RATE_RULES: { pattern: RegExp; limit: number; windowMs: number }[] = [
  { pattern: /^\/api\/matching\//, limit: 10, windowMs: 60_000 },
  { pattern: /^\/api\/upload(\/|$)/, limit: 5,  windowMs: 60_000 },
  { pattern: /^\/api\/linkedin\//, limit: 10, windowMs: 60_000 },
  // Anti-bot inscription (per-IP, per-instance — good enough for MVP)
  { pattern: /^\/(inscription|entreprises\/inscription)(\/|$)/, limit: 5, windowMs: 600_000 },
  // Anti-spam email route (admin-only but still protect against brute force)
  { pattern: /^\/api\/email(\/|$)/, limit: 20, windowMs: 60_000 },
  // Anti-brute-force login (per-IP — tight window, credential stuffing is fast-fire)
  { pattern: /^\/connexion(\/|$)/, limit: 8, windowMs: 60_000 },
  // Anti-spam password reset (per-IP — wider window, a real user rarely retries this fast)
  { pattern: /^\/mot-de-passe-oublie(\/|$)/, limit: 3, windowMs: 600_000 },
]

function checkRateLimit(ip: string, pathname: string): { limited: boolean; retryAfter: number } {
  const rule = RATE_RULES.find((r) => r.pattern.test(pathname))
  if (!rule) return { limited: false, retryAfter: 0 }

  // Bucket key = ip + route prefix (first 3 path segments)
  const bucket = pathname.split('/').slice(0, 3).join('/')
  const key = `${ip}:${bucket}`
  const now = Date.now()
  const entry = _rateWindows.get(key)

  if (!entry || now >= entry.resetAt) {
    _rateWindows.set(key, { count: 1, resetAt: now + rule.windowMs })
    return { limited: false, retryAfter: 0 }
  }

  entry.count += 1
  if (entry.count > rule.limit) {
    return { limited: true, retryAfter: Math.ceil((entry.resetAt - now) / 1000) }
  }

  return { limited: false, retryAfter: 0 }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── Rate limiting (before auth — short-circuits expensive routes) ──────────
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    request.headers.get('x-real-ip') ??
    '127.0.0.1'

  const { limited, retryAfter } = checkRateLimit(ip, pathname)
  if (limited) {
    return new NextResponse(
      JSON.stringify({ error: 'Trop de requêtes. Réessayez dans quelques instants.' }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(retryAfter),
        },
      },
    )
  }

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
    const appRole = (user as any)?.app_metadata?.role as string | undefined
    const userRole = user?.user_metadata?.role as string | undefined
    const role = appRole === 'SUPER_ADMIN' || appRole === 'ADMIN' ? appRole : userRole
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
