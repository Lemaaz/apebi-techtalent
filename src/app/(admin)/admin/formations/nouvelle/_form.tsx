'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { createFormation, type FormationState } from '../actions'

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

export function NouvelleFormationForm({
  institutions,
  domains,
}: {
  institutions: Array<{ id: string; name: string }>
  domains: Array<{ id: string; name_fr: string }>
}) {
  const [state, action] = useActionState<FormationState, FormData>(createFormation, { error: null })

  return (
    <form action={action} className="space-y-5">
      <div>
        <label className="mb-1.5 block text-xs font-medium">
          Titre <span className="text-rose-500">*</span>
        </label>
        <Input name="title" required placeholder="Développeur Full Stack React / Node.js" />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium">Description</label>
        <Textarea name="description" rows={4} maxLength={1000} placeholder="Décrivez le contenu et les objectifs de la formation…" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-medium">Institution</label>
          <select name="institution_id" className={selectCls()}>
            <option value="">Aucune / Indépendante</option>
            {institutions.map((i) => (
              <option key={i.id} value={i.id}>{i.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium">Domaine C5</label>
          <select name="domain_id" className={selectCls()}>
            <option value="">Tous domaines</option>
            {domains.map((d) => (
              <option key={d.id} value={d.id}>{d.name_fr}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-medium">Modalité</label>
          <select name="modality" className={selectCls()} defaultValue="Présentiel">
            <option value="Présentiel">Présentiel</option>
            <option value="Online">Online</option>
            <option value="Hybride">Hybride</option>
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium">Niveau</label>
          <select name="level" className={selectCls()} defaultValue="Tous niveaux">
            <option value="Tous niveaux">Tous niveaux</option>
            <option value="Débutant">Débutant</option>
            <option value="Intermédiaire">Intermédiaire</option>
            <option value="Avancé">Avancé</option>
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-medium">Durée</label>
          <Input name="duration_text" placeholder="ex : 3 mois, 40h, 12 semaines" />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium">Tarif</label>
          <Input name="price_range" placeholder="ex : Gratuit, 5 000–10 000 MAD" />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium">URL d&apos;inscription</label>
        <Input name="url_inscription" type="url" placeholder="https://…" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-medium">Statut</label>
          <select name="status" className={selectCls()} defaultValue="active">
            <option value="active">Active (publique)</option>
            <option value="draft">Brouillon</option>
          </select>
        </div>
        <div className="flex items-end gap-2 pb-0.5">
          <input type="hidden" name="is_featured" value="false" id="featured-hidden" />
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="size-4 rounded"
              onChange={(e) => {
                const hidden = document.getElementById('featured-hidden') as HTMLInputElement
                if (hidden) hidden.value = e.target.checked ? 'true' : 'false'
              }}
            />
            Mettre en avant (⭐)
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
