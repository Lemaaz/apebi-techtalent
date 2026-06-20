'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Briefcase, Search, Heart, Building2, Award, Users, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/entreprise/dashboard',         label: 'Dashboard',           icon: LayoutDashboard, exact: true },
  { href: '/entreprise/offres',            label: 'Mes Offres',          icon: Briefcase },
  { href: '/entreprise/candidatures',      label: 'Candidatures',        icon: Users },
  { href: '/entreprise/recherche-talents', label: 'Recherche Talents',   icon: Search },
  { href: '/entreprise/favoris',           label: 'Favoris',             icon: Heart },
  { href: '/entreprise/profil/modifier',   label: 'Mon Entreprise',      icon: Building2 },
  { href: '/entreprise/label',             label: 'Label APEBI',         icon: Award },
  { href: '/entreprise/parametres',        label: 'Paramètres',          icon: Settings },
]

export function CompanySidebarNav() {
  const pathname = usePathname()

  return (
    <nav aria-label="Navigation recruteur">
      <ul className="space-y-0.5" role="list">
        {NAV.map(({ href, label, icon: Icon, exact }) => {
          const isActive = exact ? pathname === href : pathname.startsWith(href)

          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-colors',
                  isActive
                    ? 'bg-[var(--apebi-cyan-muted)] text-[var(--apebi-cyan)] font-semibold border-r-2 border-[var(--apebi-cyan)] rounded-r-none'
                    : 'text-[var(--apebi-text-muted)] hover:bg-[var(--apebi-bg-alt)] hover:text-foreground',
                )}
              >
                <Icon
                  className="size-4 shrink-0"
                  aria-hidden
                  style={{ color: isActive ? 'var(--apebi-cyan)' : undefined }}
                />
                {label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
