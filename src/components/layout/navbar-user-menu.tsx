'use client'
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Menu, X, ChevronDown, LogOut, User, LayoutDashboard, Search, Bookmark, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import { signOut } from '@/app/actions'

type UserInfo = {
  email: string
  role: 'talent' | 'entreprise' | string
  initials: string
}

const AVATAR_BG = 'bg-primary/10 text-primary'

export function NavbarUserMenu({ user }: { user: UserInfo | null }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const t = useTranslations('nav')

  const NAV_LINKS = [
    { href: '/entreprises', label: t('companies') },
    { href: '/offres', label: t('jobs') },
    { href: '/formation', label: t('training') },
    { href: '/a-propos', label: t('about') },
  ]

  // Full-screen overlay : verrouille le scroll + ferme sur Escape
  useEffect(() => {
    if (!mobileOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMobileOpen(false) }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

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
              className="nav-link flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-foreground hover:bg-muted"
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
            <Link href="/connexion" className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'nav-ghost')}>
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
        className="nav-link flex size-11 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground md:hidden"
        onClick={() => setMobileOpen(true)}
        aria-expanded={mobileOpen}
        aria-label="Ouvrir le menu"
      >
        <Menu className="size-5" />
      </button>

      {/* Mobile full-screen overlay — porté dans <body> pour échapper au containing-block
          créé par le backdrop-filter de la navbar (sinon `fixed inset-0` se cale sur la navbar) */}
      {mobileOpen && createPortal(
        <div
          className="fixed inset-0 z-[60] flex flex-col bg-[var(--apebi-dark-90)] md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Menu de navigation"
        >
          <div className="flex items-center justify-between px-4 py-3">
            <span className="font-heading text-sm font-semibold text-white">
              <span className="text-[var(--apebi-cyan)]">Tech</span>Talent
            </span>
            <button
              onClick={() => setMobileOpen(false)}
              aria-label="Fermer le menu"
              className="flex size-11 items-center justify-center rounded-md text-white/70 hover:bg-white/10 hover:text-white"
            >
              <X className="size-6" />
            </button>
          </div>

          <nav className="flex flex-1 flex-col px-6 pt-4" aria-label="Navigation mobile">
            {NAV_LINKS.map(({ href, label }, i) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className="rise-in border-b border-white/10 py-4 font-heading text-2xl font-semibold text-white transition-colors hover:text-[var(--apebi-cyan)]"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                {label}
              </Link>
            ))}
          </nav>

          <div className="flex flex-col gap-3 px-6 pb-10">
            {user ? (
              <>
                <Link
                  href={dashboardHref}
                  onClick={() => setMobileOpen(false)}
                  className="flex min-h-12 items-center justify-center rounded-lg border border-white/20 px-5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                >
                  {dashboardLabel}
                </Link>
                <form action={signOut}>
                  <button
                    type="submit"
                    className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg px-5 text-sm font-semibold text-rose-400 transition-colors hover:bg-rose-500/10"
                  >
                    <LogOut className="size-4" aria-hidden />
                    Déconnexion
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link
                  href="/connexion"
                  onClick={() => setMobileOpen(false)}
                  className="flex min-h-12 items-center justify-center rounded-lg border border-white/20 px-5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                >
                  Se connecter
                </Link>
                <Link
                  href="/inscription"
                  onClick={() => setMobileOpen(false)}
                  className="btn-shine flex min-h-12 items-center justify-center rounded-lg bg-[var(--apebi-cyan)] px-5 text-sm font-semibold text-white transition-colors hover:bg-[var(--apebi-cyan-dark)]"
                >
                  S&apos;inscrire
                </Link>
              </>
            )}
          </div>
        </div>,
        document.body,
      )}
    </>
  )
}
