'use client'

import { useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'

export function LocaleToggle() {
  const locale = useLocale()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function toggle() {
    const next = locale === 'fr' ? 'en' : 'fr'
    document.cookie = `locale=${next}; path=/; max-age=31536000; SameSite=Lax`
    startTransition(() => {
      router.refresh()
    })
  }

  const isEN = locale === 'en'

  return (
    <button
      onClick={toggle}
      disabled={isPending}
      aria-label={isEN ? 'Passer en français' : 'Switch to English'}
      className="flex items-center gap-0.5 rounded-md px-2 py-1 text-xs font-medium transition-colors disabled:opacity-50"
      style={{ color: 'inherit', opacity: isPending ? 0.5 : 1 }}
    >
      <span style={{ opacity: isEN ? 0.4 : 1, fontWeight: isEN ? 400 : 600 }}>FR</span>
      <span className="mx-0.5 opacity-30">|</span>
      <span style={{ opacity: isEN ? 1 : 0.4, fontWeight: isEN ? 600 : 400 }}>EN</span>
    </button>
  )
}
