import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type PublicPageHeaderProps = {
  title: string
  subtitle?: string
  /** Largeur du conteneur (aligne sur le contenu de la page). */
  width?: '5xl' | '7xl'
  /** Contenu additionnel sous le titre (filtres, actions…). */
  children?: ReactNode
}

/**
 * En-tête standard des pages publiques « liste » (offres, entreprises, events).
 * Pattern unifié : texture réseau masquée + entrées échelonnées rise-in +
 * rythme py-10. Les héros riches (observatoire, formation) restent sur mesure.
 */
export function PublicPageHeader({ title, subtitle, width = '7xl', children }: PublicPageHeaderProps) {
  return (
    <div className="relative overflow-hidden border-b border-white/8 px-4 py-10 sm:px-6">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-grid-cyan mask-radial opacity-50" />
      <div className={cn('relative mx-auto', width === '5xl' ? 'max-w-5xl' : 'max-w-7xl')}>
        <h1 className="rise-in font-heading text-2xl font-bold text-white sm:text-3xl">
          {title}
        </h1>
        {subtitle && (
          <p className="rise-in mt-1.5 max-w-xl text-sm text-white/50" style={{ animationDelay: '80ms' }}>
            {subtitle}
          </p>
        )}
        {children && (
          <div className="rise-in mt-5" style={{ animationDelay: '160ms' }}>
            {children}
          </div>
        )}
      </div>
    </div>
  )
}
