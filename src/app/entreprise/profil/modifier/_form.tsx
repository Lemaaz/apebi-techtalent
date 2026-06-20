'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { AlertCircle, CheckCircle } from 'lucide-react'
import { ImageUpload } from '@/components/ui/image-upload'
import { updateCompanyProfile, type UpdateProfileState } from './actions'

export function CompanyProfileForm({
  company,
}: {
  company: {
    logo_url: string | null
    banner_url: string | null
    description: string | null
    culture: string | null
    website_url: string | null
    linkedin_url: string | null
    sector: string
    company_size: string | null
    city: string | null
    country: string
  }
}) {
  const [state, action, isPending] = useActionState<UpdateProfileState, FormData>(
    updateCompanyProfile,
    { error: null },
  )

  const FIELD =
    'w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring'

  return (
    <form action={action} className="space-y-6">
      {/* Logo + Bannière */}
      <div className="grid gap-4 sm:grid-cols-2">
        <ImageUpload
          bucket="logos"
          fieldName="logo_url"
          currentUrl={company.logo_url}
          label="Logo"
          hint="JPEG, PNG ou WebP — max 2 Mo"
          shape="square"
        />
        <ImageUpload
          bucket="banners"
          fieldName="banner_url"
          currentUrl={company.banner_url}
          label="Bannière"
          hint="Image de couverture — max 5 Mo"
          shape="wide"
        />
      </div>

      {/* Description */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">
          Présentation de l&apos;entreprise
        </label>
        <p className="mb-2 text-xs text-muted-foreground">
          Décrivez vos activités et ce qui vous rend unique (max 1 000 car.)
        </p>
        <textarea
          name="description"
          defaultValue={company.description ?? ''}
          rows={6}
          maxLength={1000}
          placeholder="Notre entreprise est spécialisée dans…"
          className={FIELD}
        />
      </div>

      {/* Culture */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">
          Culture &amp; valeurs
        </label>
        <p className="mb-2 text-xs text-muted-foreground">
          Décrivez l&apos;environnement de travail et les valeurs de votre équipe.
        </p>
        <textarea
          name="culture"
          defaultValue={company.culture ?? ''}
          rows={5}
          maxLength={1000}
          placeholder="Chez nous, la collaboration et l'innovation sont au cœur…"
          className={FIELD}
        />
      </div>

      {/* URLs */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Site web</label>
          <input
            type="url"
            name="website_url"
            defaultValue={company.website_url ?? ''}
            placeholder="https://www.monentreprise.ma"
            className={FIELD}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">LinkedIn</label>
          <input
            type="url"
            name="linkedin_url"
            defaultValue={company.linkedin_url ?? ''}
            placeholder="https://www.linkedin.com/company/…"
            className={FIELD}
          />
        </div>
      </div>

      {/* Secteur + Taille */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Secteur</label>
          <input
            type="text"
            name="sector"
            defaultValue={company.sector}
            placeholder="Transformation digitale, Cybersécurité…"
            maxLength={80}
            className={FIELD}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Taille
          </label>
          <select
            name="company_size"
            defaultValue={company.company_size ?? ''}
            className={FIELD}
          >
            <option value="">Non précisé</option>
            <option value="1-10">1 – 10 employés</option>
            <option value="11-50">11 – 50 employés</option>
            <option value="51-200">51 – 200 employés</option>
            <option value="201-500">201 – 500 employés</option>
            <option value="500+">500+ employés</option>
          </select>
        </div>
      </div>

      {/* Ville + Pays */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Ville</label>
          <input
            type="text"
            name="city"
            defaultValue={company.city ?? ''}
            placeholder="Casablanca"
            maxLength={80}
            className={FIELD}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Pays</label>
          <input
            type="text"
            name="country"
            defaultValue={company.country}
            placeholder="Maroc"
            maxLength={60}
            className={FIELD}
          />
        </div>
      </div>

      {/* Feedback */}
      {state.error && (
        <div className="flex items-start gap-2 rounded-lg bg-rose-500/10 px-3 py-2.5 text-sm text-rose-600">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          {state.error}
        </div>
      )}
      {state.success && (
        <div className="flex items-start gap-2 rounded-lg bg-emerald-500/10 px-3 py-2.5 text-sm text-emerald-700">
          <CheckCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          Vitrine mise à jour avec succès.
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 border-t border-border pt-5">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:opacity-60"
        >
          {isPending ? 'Enregistrement…' : 'Enregistrer les modifications'}
        </button>
        <Link
          href="/entreprise/dashboard"
          className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          Annuler
        </Link>
      </div>
    </form>
  )
}
