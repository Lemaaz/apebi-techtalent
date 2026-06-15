import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { NavLinks } from './nav-links'
import { NavbarUserMenu } from './navbar-user-menu'

const LOGO_COLORS = [
  '#00AFD2', '#EF4444', '#F59E0B',
  '#10B981', '#8B5CF6', '#00AFD2',
  '#F59E0B', '#00AFD2', '#EF4444',
]

export async function Navbar() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const userInfo = user
    ? {
        email: user.email ?? '',
        role: (user.user_metadata?.role as string) ?? 'talent',
        initials: (user.email ?? '?').slice(0, 2).toUpperCase(),
      }
    : null

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="relative mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Logo */}
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <div aria-hidden className="grid h-7 w-7 grid-cols-3 gap-[2px]">
            {LOGO_COLORS.map((c, i) => (
              <span key={i} className="rounded-[2px]" style={{ background: c }} />
            ))}
          </div>
          <span className="font-heading text-sm font-semibold">
            APEBI <span className="text-primary">Tech</span>Talent
          </span>
        </Link>

        {/* Desktop nav links */}
        <NavLinks />

        {/* Auth menu (desktop + mobile toggle) */}
        <NavbarUserMenu user={userInfo} />
      </div>
    </header>
  )
}
