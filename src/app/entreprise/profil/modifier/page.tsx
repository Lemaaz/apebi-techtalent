import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Building2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { CompanyProfileForm } from './_form'

export const metadata: Metadata = {
  title: 'Éditer ma vitrine',
}

type CompanyRow = {
  id: string
  name: string
  slug: string
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
  validation_status: string
}

export default async function ModifierProfilEntreprisePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { data: member } = await supabase
    .from('company_members')
    .select('company_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!member) redirect('/entreprise/dashboard')

  const { data: company } = await supabase
    .from('company_profiles')
    .select(
      'id, name, slug, logo_url, banner_url, description, culture, website_url, linkedin_url, sector, company_size, city, country, validation_status',
    )
    .eq('id', member.company_id)
    .maybeSingle<CompanyRow>()

  if (!company) redirect('/entreprise/dashboard')

  return (
      <>
        {/* Header */}
        <div className="border-b border-border bg-muted/30 px-4 py-6 sm:px-6">
          <div className="mx-auto max-w-3xl">
            <Link
              href="/entreprise/dashboard"
              className="mb-3 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="size-3.5" aria-hidden />
              Dashboard
            </Link>
            <div className="flex items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Building2 className="size-4 text-primary" aria-hidden />
              </div>
              <div>
                <h1 className="font-heading text-xl font-bold text-foreground">
                  Éditer ma vitrine
                </h1>
                <p className="text-sm text-muted-foreground">{company.name}</p>
              </div>
            </div>

            {company.validation_status === 'pending' && (
              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800">
                Votre entreprise est en attente de validation. Les modifications seront visibles
                après approbation par l&apos;équipe APEBI.
              </div>
            )}
          </div>
        </div>

        {/* Form */}
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
          <CompanyProfileForm company={company} />

          {/* Preview link */}
          {company.validation_status === 'approved' && (
            <div className="mt-6 rounded-xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">
                Votre vitrine publique est accessible à{' '}
                <Link
                  href={`/entreprises/${company.slug}`}
                  className="text-primary hover:underline"
                  target="_blank"
                >
                  /entreprises/{company.slug}
                </Link>
              </p>
            </div>
          )}
        </div>
      </>

  )
}
