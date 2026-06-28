import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Pencil, Eye, Globe, MapPin, Building2, ExternalLink } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Mon entreprise',
  robots: { index: false },
}

export default async function EntrepriseProfilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { data: member } = await supabase
    .from('company_members')
    .select(`
      company_profiles (
        id, name, slug, description, culture,
        logo_url, banner_url, website_url, linkedin_url,
        sector, company_size, city, country,
        validation_status, has_techtalent_label
      )
    `)
    .eq('user_id', user.id)
    .maybeSingle<{
      company_profiles: {
        id: string; name: string; slug: string; description: string | null; culture: string | null
        logo_url: string | null; banner_url: string | null; website_url: string | null
        linkedin_url: string | null; sector: string; company_size: string | null
        city: string | null; country: string; validation_status: string
        has_techtalent_label: boolean
      } | null
    }>()

  if (!member?.company_profiles) redirect('/entreprise/dashboard')

  const company = member.company_profiles
  const publicSlug = `/entreprises/${company.slug}`

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-overline mb-1">Mon entreprise</p>
          <h1 className="font-heading text-xl font-semibold text-foreground">{company.name}</h1>
          {company.validation_status !== 'approved' && (
            <span className="mt-1 inline-block rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700">
              En attente de validation
            </span>
          )}
        </div>

        {/* CTAs */}
        <div className="flex shrink-0 gap-2">
          <Link
            href={publicSlug}
            target="_blank"
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-1.5 text-xs')}
            title="Voir la vitrine publique dans un nouvel onglet"
          >
            <Eye className="size-3.5" aria-hidden />
            Vitrine publique
          </Link>
          <Link
            href="/entreprise/profil/modifier"
            className={cn(buttonVariants({ size: 'sm' }), 'gap-1.5 text-xs')}
          >
            <Pencil className="size-3.5" aria-hidden />
            Modifier
          </Link>
        </div>
      </div>

      {/* Banner */}
      {company.banner_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={company.banner_url}
          alt=""
          className="h-32 w-full rounded-xl object-cover"
          aria-hidden
        />
      )}

      {/* Logo + infos */}
      <div
        className="rounded-xl border p-5"
        style={{ background: 'var(--apebi-bg-alt)', borderColor: 'var(--apebi-border)' }}
      >
        <div className="flex items-start gap-4">
          {company.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={company.logo_url}
              alt=""
              className="size-16 shrink-0 rounded-xl object-contain bg-white/10"
            />
          ) : (
            <div className="flex size-16 shrink-0 items-center justify-center rounded-xl bg-[#3A4652] font-heading text-lg font-bold text-white">
              {company.name.slice(0, 2).toUpperCase()}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-heading text-[13px] font-semibold text-foreground">{company.sector}</span>
              {company.company_size && (
                <span className="text-[12px] text-muted-foreground">· {company.company_size}</span>
              )}
              {company.has_techtalent_label && (
                <span className="rounded-full bg-[#00AFD2]/10 px-2 py-0.5 text-[11px] font-semibold text-[#00AFD2]">
                  Label APEBI TechTalent
                </span>
              )}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-[12px] text-muted-foreground">
              {company.city && (
                <span className="flex items-center gap-1"><MapPin className="size-3" aria-hidden />{company.city}</span>
              )}
              {company.website_url && (
                <a href={company.website_url} target="_blank" rel="noopener noreferrer"
                   className="flex items-center gap-1 hover:text-foreground transition-colors">
                  <Globe className="size-3" aria-hidden />Site web
                </a>
              )}
              {company.linkedin_url && (
                <a href={company.linkedin_url} target="_blank" rel="noopener noreferrer"
                   className="flex items-center gap-1 hover:text-foreground transition-colors">
                  <ExternalLink className="size-3" aria-hidden />LinkedIn
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      {company.description ? (
        <section>
          <h2 className="mb-2 font-heading text-[14px] font-semibold text-foreground">Description</h2>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
            {company.description}
          </p>
        </section>
      ) : (
        <div className="rounded-xl border-2 border-dashed border-border p-6 text-center">
          <Building2 className="mx-auto mb-2 size-8 text-muted-foreground/40" aria-hidden />
          <p className="font-heading text-sm font-semibold text-foreground">Description manquante</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Ajoutez une description pour que votre vitrine attire les talents.
          </p>
          <Link
            href="/entreprise/profil/modifier"
            className={cn(buttonVariants({ size: 'sm' }), 'mt-3')}
          >
            Compléter mon profil
          </Link>
        </div>
      )}

      {company.culture && (
        <section>
          <h2 className="mb-2 font-heading text-[14px] font-semibold text-foreground">Culture & valeurs</h2>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
            {company.culture}
          </p>
        </section>
      )}

      {/* Link to public vitrine */}
      <div
        className="flex items-center justify-between rounded-xl border p-4"
        style={{ borderColor: 'var(--apebi-border)' }}
      >
        <div>
          <p className="font-heading text-[13px] font-semibold text-foreground">Vitrine publique</p>
          <p className="text-[12px] text-muted-foreground">
            Voici comment les talents voient votre entreprise sur APEBI TechTalent.
          </p>
        </div>
        <Link
          href={publicSlug}
          target="_blank"
          className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'shrink-0 gap-1.5 text-xs')}
        >
          <ExternalLink className="size-3.5" aria-hidden />
          Ouvrir
        </Link>
      </div>
    </div>
  )
}
