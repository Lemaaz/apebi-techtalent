'use client'

import { useActionState } from 'react'
import { promoteToAdmin } from './actions'

type State = { error?: string; success?: string }
const initialState: State = {}

export function PromoteAdminForm() {
  const [state, formAction, isPending] = useActionState(
    async (_prev: State, formData: FormData): Promise<State> => promoteToAdmin(formData),
    initialState,
  )

  return (
    <form action={formAction} className="flex flex-col gap-3 sm:flex-row sm:items-start">
      <div className="flex-1">
        <input
          type="email"
          name="email"
          required
          placeholder="email@entreprise.ma"
          autoComplete="off"
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2"
          style={{ '--tw-ring-color': 'rgba(139,92,246,0.4)' } as React.CSSProperties}
        />
        {state.error && (
          <p className="mt-1.5 text-[12px] text-rose-600">{state.error}</p>
        )}
        {state.success && (
          <p className="mt-1.5 text-[12px] text-emerald-600">{state.success}</p>
        )}
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="shrink-0 rounded-lg px-4 py-2 text-sm font-medium text-white transition-opacity disabled:opacity-50"
        style={{ background: '#8B5CF6' }}
      >
        {isPending ? 'Promotion...' : 'Promouvoir Admin'}
      </button>
    </form>
  )
}
