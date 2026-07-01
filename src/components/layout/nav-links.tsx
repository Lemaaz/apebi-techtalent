'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'

export function NavLinks({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname()
  const t = useTranslations('nav')

  const NAV_LINKS = [
    { href: '/entreprises', label: t('companies') },
    { href: '/offres', label: t('jobs') },
    { href: '/formation', label: t('training') },
    { href: '/observatoire', label: t('observatory') },
    { href: '/a-propos', label: t('about') },
  ]

  if (mobile) {
    return (
      <nav className="mt-2 flex flex-col gap-0.5" aria-label="Navigation mobile">
        {NAV_LINKS.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className="flex min-h-11 items-center rounded-md px-3 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            {label}
          </Link>
        ))}
      </nav>
    )
  }

  return (
    <nav className="hidden items-center gap-6 md:flex" aria-label="Navigation principale">
      {NAV_LINKS.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            'text-sm transition-colors hover:text-foreground',
            pathname.startsWith(href)
              ? 'font-medium text-foreground'
              : 'text-muted-foreground',
          )}
        >
          {label}
        </Link>
      ))}
    </nav>
  )
}
