'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, CalendarCheck, CalendarX } from 'lucide-react'
import { registerForEvent, cancelRegistration } from './actions'

type Props = {
  eventId: string
  slug: string
  isAuthenticated: boolean
  isRegistered: boolean
  isFull: boolean
  isPast: boolean
}

export function RegisterButton({ eventId, slug, isAuthenticated, isRegistered, isFull, isPast }: Props) {
  const [pending, start] = useTransition()
  const router = useRouter()

  if (isPast) {
    return (
      <p className="rounded-lg border border-white/8 bg-white/5 px-4 py-2.5 text-center text-sm text-white/45">
        Événement terminé
      </p>
    )
  }

  if (!isAuthenticated) {
    return (
      <a
        href="/connexion"
        className="flex w-full items-center justify-center rounded-lg bg-[var(--apebi-cyan)] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--apebi-cyan)]/90"
      >
        Se connecter pour s&apos;inscrire
      </a>
    )
  }

  if (isRegistered) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-center gap-2 rounded-lg bg-emerald-500/10 px-4 py-2.5 text-sm font-semibold text-emerald-400">
          <CalendarCheck className="size-4" aria-hidden />
          Vous êtes inscrit·e
        </div>
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const res = await cancelRegistration(eventId, slug)
              if (res.ok) {
                toast.success('Inscription annulée')
                router.refresh()
              } else {
                toast.error(res.error ?? 'Erreur')
              }
            })
          }
          className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-white/10 px-4 py-2 text-xs text-white/55 transition-colors hover:bg-white/5 disabled:opacity-60"
        >
          {pending ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : <CalendarX className="size-3.5" aria-hidden />}
          Annuler mon inscription
        </button>
      </div>
    )
  }

  return (
    <button
      type="button"
      disabled={pending || isFull}
      onClick={() =>
        start(async () => {
          const res = await registerForEvent(eventId, slug)
          if (res.ok) {
            toast.success('Inscription confirmée !')
            router.refresh()
          } else {
            toast.error(res.error ?? 'Erreur')
          }
        })
      }
      className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--apebi-cyan)] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--apebi-cyan)]/90 disabled:opacity-60"
    >
      {pending ? (
        <Loader2 className="size-4 animate-spin" aria-hidden />
      ) : (
        <CalendarCheck className="size-4" aria-hidden />
      )}
      {isFull ? 'Événement complet' : "S'inscrire"}
    </button>
  )
}
