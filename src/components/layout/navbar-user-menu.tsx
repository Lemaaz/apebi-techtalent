'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Menu, X, ChevronDown, LogOut, User, LayoutDashboard, Search, Bookmark, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import { signOut } from '@/app/actions'
import { NavLinks } from './nav-links'

type UserInfo = {
  email: string
  role: 'talent' | 'entreprise' | string
  initials: string
}

const AVATAR_BG = 'bg-primary/10 text-primary'

export function NavbarUserMenu({ user }: { user: UserInfo | null }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN'
  const dashboardHref = isAdmin ? '/admin'
    : user?.role === 'entreprise' ? '/entreprise/dashboard'
    : '/talent/profil'
  const dashboardLabel = isAdmin ? 'Back-office'
    : user?.role === 'entreprise' ? 'Dashboard'
    : 'Mon profil'

  return (
    <>
      {/* Desktop */}
      <div className="hidden items-center gap-2 md:flex">
        {user ? (
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              onKeyDown={(e) => { if (e.key === 'Escape') setDropdownOpen(false) }}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-foreground hover:bg-muted"
              aria-expanded={dropdownOpen}
              aria-label={`Menu de ${user.email}`}
            >
              <div
                className={cn(
                  'flex size-7 items-center justify-center rounded-full font-heading text-xs font-bold',
                  AVATAR_BG,
                )}
                aria-hidden
              >
                {user.initials}
              </div>
              <ChevronDown className="size-3.5 text-muted-foreground" aria-hidden />
            </button>

            {dropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setDropdownOpen(false)}
                  aria-hidden
                />
                <div role="menu" className="absolute right-0 top-full z-50 mt-1 w-48 rounded-xl border border-border bg-background p-1 shadow-lg">
                  <p className="truncate px-3 py-1.5 text-xs text-muted-foreground">
                    {user.email}
                  </p>
                  <div className="my-1 h-px bg-border" />
                  <Link
                    href={dashboardHref}
                    onClick={() => setDropdownOpen(false)}
                    role="menuitem"
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-muted"
                  >
                    {user.role === 'entreprise' ? (
                      <LayoutDashboard className="size-4 text-muted-foreground" aria-hidden />
                    ) : (
                      <User className="size-4 text-muted-foreground" aria-hidden />
                    )}
                    {dashboardLabel}
                  </Link>
                  {user.role === 'entreprise' && (
                    <Link
                      href="/entreprise/recherche-talents"
                      onClick={() => setDropdownOpen(false)}
                      role="menuitem"
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-muted"
                    >
                      <Search className="size-4 text-muted-foreground" aria-hidden />
                      Recherche talents
                    </Link>
                  )}
                  {user.role === 'entreprise' && (
                    <Link
                      href="/entreprise/favoris"
                      onClick={() => setDropdownOpen(false)}
                      role="menuitem"
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-muted"
                    >
                      <Bookmark className="size-4 text-muted-foreground" aria-hidden />
                      Talents favoris
                    </Link>
                  )}
                  {user.role === 'talent' && (
                    <Link
                      href="/talent/parametres"
                      onClick={() => setDropdownOpen(false)}
                      role="menuitem"
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-muted"
                    >
                      <Settings className="size-4 text-muted-foreground" aria-hidden />
                      Paramètres
                    </Link>
                  )}
                  <form action={signOut}>
                    <button
                      type="submit"
                      role="menuitem"
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-rose-600 hover:bg-rose-500/10"
                    >
                      <LogOut className="size-4" aria-hidden />
                      Déconnexion
                    </button>
                  </form>
                </div>
              </>
            )}
          </div>
        ) : (
          <>
            <Link href="/connexion" className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}>
              Se connecter
            </Link>
            <Link href="/inscription" className={cn(buttonVariants({ size: 'sm' }))}>
              S&apos;inscrire
            </Link>
          </>
        )}
      </div>

      {/* Mobile toggle */}
      <button
        className="flex size-11 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground md:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-expanded={mobileOpen}
        aria-label={mobileOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
      >
        {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
      </button>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="absolute left-0 right-0 top-full border-t border-border bg-background px-4 pb-4 md:hidden">
          <NavLinks mobile />
          <div className="mt-3 flex flex-col gap-2">
            {user ? (
              <>
                <Link
                  href={dashboardHref}
                  onClick={() => setMobileOpen(false)}
                  className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'min-h-11 justify-center')}
                >
                  {dashboardLabel}
                </Link>
                <form action={signOut}>
                  <button
                    type="submit"
                    className={cn(
                      buttonVariants({ variant: 'ghost', size: 'sm' }),
                      'min-h-11 w-full justify-center text-rose-600 hover:bg-rose-500/10 hover:text-rose-600',
                    )}
                  >
                    Déconnexion
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link
                  href="/connexion"
                  className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'min-h-11 justify-center')}
                >
                  Se connecter
                </Link>
                <Link
                  href="/inscription"
                  className={cn(buttonVariants({ size: 'sm' }), 'min-h-11 justify-center')}
                >
                  S&apos;inscrire
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
