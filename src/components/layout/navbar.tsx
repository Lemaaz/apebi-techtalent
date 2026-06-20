import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { NavLinks } from './nav-links'
import { NavbarUserMenu } from './navbar-user-menu'
import { LocaleToggle } from './locale-toggle'
import { NotificationBell } from './notification-bell'

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

  // Fetch initial notifications for authenticated users (NOT-04)
  type NotifRow = {
    id: string
    type: string
    title: string
    body: string | null
    link: string | null
    is_read: boolean | null
    created_at: string
  }
  let notifications: NotifRow[] = []
  if (user) {
    const { data } = await supabase
      .from('notifications')
      .select('id, type, title, body, link, is_read, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)
    notifications = (data ?? []) as NotifRow[]
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="relative mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Logo */}
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <div className="rounded bg-white px-2 py-0.5">
            <Image
              src="/apebi-logo.png"
              alt="APEBI"
              width={80}
              height={22}
              className="h-[22px] w-auto object-contain"
              style={{ width: 'auto' }}
              priority
            />
          </div>
          <span className="font-heading text-sm font-semibold text-foreground">
            <span className="text-primary">Tech</span>Talent
          </span>
        </Link>

        {/* Desktop nav links */}
        <NavLinks />

        {/* Locale toggle + notification bell + auth menu */}
        <div className="flex items-center gap-1">
          <LocaleToggle />
          {user && (
            <NotificationBell
              userId={user.id}
              initialNotifications={notifications}
            />
          )}
          <NavbarUserMenu user={userInfo} />
        </div>
      </div>
    </header>
  )
}
