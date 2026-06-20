'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { createInstitution, type InstitutionState } from '../actions'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} className={cn(buttonVariants({ size: 'sm' }), 'gap-1.5')}>
      {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
      Enregistrer
    </button>
  )
}

function selectCls() {
  return 'w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring'
}

export function NouvelleInstitutionForm() {
  const [state, action] = useActionState<InstitutionState, FormData>(createInstitution, { error: null })

  return (
    <form action={action} className="space-y-5">
      <div>
        <label className="mb-1.5 block text-xs font-medium">
          Nom <span className="text-rose-500">*</span>
        </label>
        <Input name="name" required placeholder="EMSI, YouCode, OpenClassrooms…" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-medium">Type</label>
          <select name="type" className={selectCls()} defaultValue="autre">
            <option value="ecole">École</option>
            <option value="bootcamp">Bootcamp</option>
            <option value="universite">Université</option>
            <option value="certification">Organisme de certification</option>
            <option value="autre">Autre</option>
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium">Ville</label>
          <Input name="city" placeholder="Casablanca, Rabat…" />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium">Description</label>
        <Textarea name="description" rows={3} maxLength={1000} placeholder="Présentation de l'institution…" />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium">Site web</label>
        <Input name="website_url" type="url" placeholder="https://…" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-medium">Statut</label>
          <select name="status" className={selectCls()} defaultValue="active">
            <option value="active">Active (publique)</option>
            <option value="draft">Brouillon</option>
          </select>
        </div>
        <div className="flex items-end pb-0.5">
          <input type="hidden" name="is_apebi_partner" value="false" id="partner-hidden" />
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="size-4 rounded"
              onChange={(e) => {
                const hidden = document.getElementById('partner-hidden') as HTMLInputElement
                if (hidden) hidden.value = e.target.checked ? 'true' : 'false'
              }}
            />
            Partenaire officiel APEBI
          </label>
        </div>
      </div>

      {state.error && (
        <p role="alert" className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-600">
          {state.error}
        </p>
      )}

      <div className="flex justify-end pt-2">
        <SubmitButton />
      </div>
    </form>
  )
}
