'use client'

import { useActionState } from 'react'
import { createCompanyDirect } from './actions'

type State = { error?: string; success?: string }

export function CreateCompanyForm() {
  const [state, formAction, isPending] = useActionState(
    createCompanyDirect,
    undefined,
  )

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          name="name"
          required
          placeholder="Nom de l'entreprise"
          autoComplete="off"
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2"
          style={{ '--tw-ring-color': 'rgba(0,175,210,0.4)' } as React.CSSProperties}
        />
        <input
          name="email"
          type="email"
          required
          placeholder="Email du compte recruteur"
          autoComplete="off"
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2"
          style={{ '--tw-ring-color': 'rgba(0,175,210,0.4)' } as React.CSSProperties}
        />
        <input
          name="password"
          type="password"
          required
          placeholder="Mot de passe temporaire (8 car. min.)"
          minLength={8}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2"
          style={{ '--tw-ring-color': 'rgba(0,175,210,0.4)' } as React.CSSProperties}
        />
        <input
          name="role_in_company"
          placeholder="Rôle dans l'entreprise (ex : DRH, CEO)"
          defaultValue="Administrateur"
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2"
          style={{ '--tw-ring-color': 'rgba(0,175,210,0.4)' } as React.CSSProperties}
        />
      </div>
      {state?.error && (
        <p className="text-[12px] text-rose-600">{state.error}</p>
      )}
      {state?.success && (
        <p className="text-[12px] text-emerald-600">{state.success}</p>
      )}
      <div>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg px-4 py-2 text-sm font-medium text-white transition-opacity disabled:opacity-50"
          style={{ background: 'var(--apebi-cyan)' }}
        >
          {isPending ? 'Création en cours...' : "Créer l'entreprise"}
        </button>
      </div>
    </form>
  )
}
