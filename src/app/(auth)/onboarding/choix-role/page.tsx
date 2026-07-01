'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Briefcase, User, ArrowRight, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

type Role = 'talent' | 'entreprise'

const OPTIONS: { role: Role; icon: typeof User; title: string; description: string; cta: string }[] = [
  {
    role: 'talent',
    icon: User,
    title: 'Je suis un talent',
    description: 'Créez votre profil, mettez en avant vos compétences et postulez aux offres des entreprises membres APEBI.',
    cta: 'Créer mon profil talent',
  },
  {
    role: 'entreprise',
    icon: Briefcase,
    title: 'Je représente une entreprise',
    description: 'Créez la vitrine de votre entreprise, publiez des offres et accédez au vivier de talents validés APEBI.',
    cta: 'Accéder au dashboard recruteur',
  },
]

export default function ChoixRolePage() {
  const [selected, setSelected] = useState<Role | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  async function handleConfirm() {
    if (!selected) return

    startTransition(async () => {
      const supabase = createClient()
      await supabase.auth.updateUser({ data: { role: selected } })
      router.push(selected === 'entreprise' ? '/entreprises/inscription' : '/talent/inscription')
    })
  }

  return (
    <div className="w-full max-w-lg">
      <div className="mb-8 text-center">
        <h1 className="font-heading text-2xl font-bold text-gray-900">
          Bienvenue sur APEBI TechTalent
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Dites-nous comment vous souhaitez utiliser la plateforme.
        </p>
      </div>

      <div className="grid gap-4">
        {OPTIONS.map(({ role, icon: Icon, title, description, cta }) => (
          <button
            key={role}
            type="button"
            onClick={() => setSelected(role)}
            className={cn(
              'group relative flex items-start gap-4 rounded-xl border-2 p-5 text-left transition-all',
              selected === role
                ? 'border-[var(--apebi-cyan)] bg-[var(--apebi-cyan)]/5 shadow-sm'
                : 'border-gray-200 bg-white hover:border-gray-300',
            )}
          >
            {/* Selection indicator */}
            <div
              className={cn(
                'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-all',
                selected === role
                  ? 'border-[var(--apebi-cyan)] bg-[var(--apebi-cyan)]'
                  : 'border-gray-300',
              )}
            >
              {selected === role && (
                <div className="size-2 rounded-full bg-white" />
              )}
            </div>

            {/* Icon */}
            <div
              className={cn(
                'flex size-10 shrink-0 items-center justify-center rounded-lg transition-all',
                selected === role
                  ? 'bg-[var(--apebi-cyan)]/15'
                  : 'bg-gray-100 group-hover:bg-gray-150',
              )}
            >
              <Icon
                className={cn(
                  'size-5 transition-colors',
                  selected === role ? 'text-[var(--apebi-cyan)]' : 'text-gray-500',
                )}
              />
            </div>

            {/* Text */}
            <div className="flex-1">
              <p
                className={cn(
                  'font-heading text-base font-semibold',
                  selected === role ? 'text-[var(--apebi-cyan)]' : 'text-gray-900',
                )}
              >
                {title}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-gray-500">{description}</p>
              <p
                className={cn(
                  'mt-2 text-xs font-medium',
                  selected === role ? 'text-[var(--apebi-cyan)]' : 'text-gray-400',
                )}
              >
                {cta}
              </p>
            </div>
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={handleConfirm}
        disabled={!selected || isPending}
        className={cn(
          'mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold text-white transition-all',
          selected && !isPending
            ? 'bg-[var(--apebi-cyan)] hover:bg-[var(--apebi-cyan-dark)]'
            : 'cursor-not-allowed bg-gray-200 text-gray-400',
        )}
      >
        {isPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <>
            Continuer
            <ArrowRight className="size-4" />
          </>
        )}
      </button>
    </div>
  )
}
