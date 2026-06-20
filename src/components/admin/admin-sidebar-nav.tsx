'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, Building2, Briefcase, Award, CalendarDays, GraduationCap, School, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/admin',             label: 'Dashboard',    icon: LayoutDashboard, exact: true },
  { href: '/admin/talents',     label: 'Talents',      icon: Users },
  { href: '/admin/entreprises', label: 'Entreprises',  icon: Building2 },
  { href: '/admin/offres',      label: 'Offres',       icon: Briefcase },
  { href: '/admin/labels',      label: 'Labels',       icon: Award },
  { href: '/admin/events',      label: 'Événements',   icon: CalendarDays },
  { href: '/admin/formations',  label: 'Formations',   icon: GraduationCap },
  { href: '/admin/institutions',label: 'Institutions', icon: School },
]

const SUPER_NAV = [
  { href: '/admin/super', label: 'Super Admin', icon: ShieldCheck, exact: false },
]

export function AdminSidebarNav({ superAdmin = false }: { superAdmin?: boolean }) {
  const pathname = usePathname()
  const items = superAdmin ? [...NAV, ...SUPER_NAV] : NAV

  return (
    <nav aria-label="Navigation admin">
      <ul className="space-y-0.5" role="list">
        {items.map(({ href, label, icon: Icon, exact }) => {
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
