'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

type NavbarShellProps = {
  variant?: 'default' | 'landing'
  children: ReactNode
}

/**
 * Enveloppe client de la navbar.
 * - variant="default" : navbar blanche sticky, comportement inchangé (toutes les pages app/public).
 * - variant="landing" : navbar fixe, transparente au-dessus du hero sombre puis solide claire
 *   après 40px de scroll (gap #5 DESIGN_SPEC). L'attribut `data-nav-top` pilote l'adaptation
 *   des couleurs des enfants (voir globals.css).
 */
export function NavbarShell({ variant = 'default', children }: NavbarShellProps) {
  const isLanding = variant === 'landing'
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    if (!isLanding) return
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll() // état initial (rechargement en cours de page)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [isLanding])

  const atTop = isLanding && !scrolled

  return (
    <header
      data-nav-top={atTop ? 'true' : 'false'}
      className={cn(
        'top-0 z-50 transition-colors duration-300',
        isLanding ? 'fixed inset-x-0' : 'sticky',
        atTop
          ? 'border-b border-transparent bg-transparent text-white'
          : 'border-b border-border bg-background/95 backdrop-blur-sm',
      )}
    >
      <div className="relative mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {children}
      </div>
    </header>
  )
}
