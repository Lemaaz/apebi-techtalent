'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { updateInstitution, type InstitutionState } from '../../actions'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} className={cn(buttonVariants({ size: 'sm' }), 'gap-1.5')}>
      {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
      Enregistrer les modifications
    </button>
  )
}

function selectCls() {
  return 'w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring'
}

type Institution = {
  id: string
  name: string
  type: string
  description: string | null
  website_url: string | null
  city: string | null
  is_apebi_partner: boolean | null
  status: string | null
}

export function ModifierInstitutionForm({ institution }: { institution: Institution }) {
  const [state, action] = useActionState<InstitutionState, FormData>(updateInstitution, { error: null })

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="id" value={institution.id} />

      <div>
        <label className="mb-1.5 block text-xs font-medium">
          Nom <span className="text-rose-500">*</span>
        </label>
        <Input name="name" required defaultValue={institution.name} />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium">Type</label>
        <select name="type" className={selectCls()} defaultValue={institution.type}>
          <option value="ecole">École</option>
          <option value="bootcamp">Bootcamp</option>
          <option value="universite">Université</option>
          <option value="certification">Certification</option>
          <option value="autre">Organisme</option>
        </select>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium">Description</label>
        <Textarea name="description" rows={4} maxLength={1000} defaultValue={institution.description ?? ''} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-medium">Site web</label>
          <Input name="website_url" type="url" defaultValue={institution.website_url ?? ''} placeholder="https://…" />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium">Ville</label>
          <Input name="city" defaultValue={institution.city ?? ''} placeholder="Casablanca" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-medium">Statut</label>
          <select name="status" className={selectCls()} defaultValue={institution.status ?? 'active'}>
            <option value="active">Active (publique)</option>
            <option value="draft">Brouillon</option>
          </select>
        </div>
        <div className="flex items-end gap-2 pb-0.5">
          <input type="hidden" name="is_apebi_partner" value={String(institution.is_apebi_partner ?? false)} id="partner-hidden-edit" />
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="size-4 rounded"
              defaultChecked={institution.is_apebi_partner ?? false}
              onChange={(e) => {
                const hidden = document.getElementById('partner-hidden-edit') as HTMLInputElement
                if (hidden) hidden.value = e.target.checked ? 'true' : 'false'
              }}
            />
            Partenaire APEBI
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
