import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  MapPin, Globe, Code2, ExternalLink, GraduationCap,
  Eye, ArrowLeft,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Aperçu recruteur de mon profil',
  robots: { index: false },
}

// ── Types (identiques à /entreprise/talents/[id]) ────────────

type TalentRow = {
  id: string
  first_name: string
  last_name: string
  title: string | null
  bio: string | null
  avatar_url: string | null
  city: string | null
  country: string
  linkedin_url: string | null
  github_url: string | null
  portfolio_url: string | null
  years_experience: number | null
  seniority_level: string | null
  availability: string | null
  job_type: string[] | null
  remote_preference: string | null
  expected_salary_range: string | null
  talent_skills: Array<{
    level: string | null
    skills: { id: string; name: string; domains: { name_fr: string } | null } | null
  }>
  experiences: Array<{
    id: string
    company_name: string
    title: string
    description: string | null
    start_date: string
    end_date: string | null
    is_current: boolean
    location: string | null
  }>
  educations: Array<{
    id: string
    institution: string
    degree: string | null
    field: string | null
    start_year: number | null
    end_year: number | null
    is_apebi_labeled: boolean
  }>
}

const AVATAR_PALETTES = [
  'bg-primary/10 text-primary',
  'bg-[#3A4652]/10 text-[#3A4652]',
  'bg-emerald-500/10 text-emerald-600',
  'bg-violet-500/10 text-violet-600',
  'bg-amber-500/10 text-amber-600',
]

function avatarColor(name: string): string {
  let hash = 0
  for (const c of name) hash = (hash * 31 + c.charCodeAt(0)) & 0xffff
  return AVATAR_PALETTES[hash % AVATAR_PALETTES.length]
}

function formatDateRange(start: string, end: string | null, isCurrent: boolean): string {
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })
  if (isCurrent) return `${fmt(start)} – Présent`
  if (!end) return fmt(start)
  return `${fmt(start)} – ${fmt(end)}`
}

const AVAILABILITY_STYLES: Record<string, string> = {
  Immédiate: 'bg-emerald-500/10 text-emerald-600',
  '1 mois': 'bg-amber-500/10 text-amber-700',
  '3 mois': 'bg-orange-500/10 text-orange-700',
  'Non disponible': 'bg-muted text-muted-foreground',
}

export default async function AperçuRecruteurPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const appRole = (user as any).app_metadata?.role as string | undefined
  const role = appRole === 'SUPER_ADMIN' || appRole === 'ADMIN' ? appRole : (user.user_metadata?.role as string | undefined)
  if (role === 'SUPER_ADMIN' || role === 'ADMIN') redirect('/admin')
  if (role === 'entreprise') redirect('/entreprise/dashboard')

  const { data: talent } = await supabase
    .from('talent_profiles')
    .select(
      `id, first_name, last_name, title, bio, avatar_url,
       city, country, linkedin_url, github_url, portfolio_url,
       years_experience, seniority_level, availability, job_type,
       remote_preference, expected_salary_range,
       talent_skills (
         level,
         skills ( id, name, domains ( name_fr ) )
       ),
       experiences ( id, company_name, title, description, start_date, end_date, is_current, location ),
       educations ( id, institution, degree, field, start_year, end_year, is_apebi_labeled )`,
    )
    .eq('user_id', user.id)
    .maybeSingle<TalentRow>()

  if (!talent) redirect('/talent/inscription')

  const fullName = `${talent.first_name} ${talent.last_name}`
  const initials = `${talent.first_name[0] ?? ''}${talent.last_name[0] ?? ''}`.toUpperCase()

  type DomainGroup = { domainName: string; skills: Array<{ name: string; level: string | null }> }
  const skillsByDomain = new Map<string, DomainGroup>()
  for (const ts of talent.talent_skills ?? []) {
    if (!ts.skills) continue
    const domainName = ts.skills.domains?.name_fr ?? 'Autres'
    if (!skillsByDomain.has(domainName)) skillsByDomain.set(domainName, { domainName, skills: [] })
    skillsByDomain.get(domainName)!.skills.push({ name: ts.skills.name, level: ts.level })
  }

  const experiences = [...(talent.experiences ?? [])].sort((a, b) => {
    if (a.is_current && !b.is_current) return -1
    if (!a.is_current && b.is_current) return 1
    return new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
  })

  const educations = [...(talent.educations ?? [])].sort(
    (a, b) => (b.end_year ?? 9999) - (a.end_year ?? 9999),
  )

  return (
    <div className="min-h-dvh bg-background">
      {/* ── Bannière aperçu ───────────────────────────────────── */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-amber-200 bg-amber-50 px-4 py-2.5 sm:px-6">
        <div className="flex items-center gap-2">
          <Eye className="size-4 text-amber-600" aria-hidden />
          <p className="font-heading text-[13px] font-semibold text-amber-800">
            Mode aperçu — Vue recruteur
          </p>
          <span className="hidden text-[12px] text-amber-600 sm:inline">
            · Ce que voit un recruteur APEBI sur votre profil
          </span>
        </div>
        <Link
          href="/talent/profil"
          className={cn(
            buttonVariants({ variant: 'outline', size: 'sm' }),
            'gap-1.5 border-amber-300 text-xs text-amber-700 hover:bg-amber-100',
          )}
        >
          <ArrowLeft className="size-3.5" aria-hidden />
          Retour à mon profil
        </Link>
      </div>

      {/* ── Header talent ─────────────────────────────────────── */}
      <div className="border-b border-border bg-muted/30 px-4 py-6 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-4">
              {talent.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={talent.avatar_url}
                  alt={fullName}
                  className="size-16 shrink-0 rounded-2xl object-cover"
                />
              ) : (
                <div
                  aria-hidden
                  className={cn(
                    'flex size-16 shrink-0 items-center justify-center rounded-2xl font-heading text-xl font-bold',
                    avatarColor(fullName),
                  )}
                >
                  {initials}
                </div>
              )}

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-heading text-xl font-bold text-foreground">{fullName}</h1>
                  {talent.availability && AVAILABILITY_STYLES[talent.availability] && (
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-[11px] font-medium',
                        AVAILABILITY_STYLES[talent.availability],
                      )}
                    >
                      {talent.availability}
                    </span>
                  )}
                </div>
                {talent.title && (
                  <p className="mt-0.5 text-sm text-muted-foreground">{talent.title}</p>
                )}
                <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                  {talent.city && (
                    <>
                      <MapPin className="size-3" aria-hidden />
                      {talent.city}
                    </>
                  )}
                  {talent.seniority_level && (
                    <><span aria-hidden>·</span>{talent.seniority_level}</>
                  )}
                  {talent.years_experience != null && (
                    <><span aria-hidden>·</span>{talent.years_experience} an{talent.years_experience > 1 ? 's' : ''} d&apos;exp.</>
                  )}
                </p>
              </div>
            </div>

            {/* Actions visibles côté recruteur — désactivées en mode aperçu */}
            <div className="shrink-0 opacity-40 pointer-events-none" title="Boutons visibles par les recruteurs (désactivés en mode aperçu)">
              <div className="inline-flex items-center gap-1.5 rounded-lg bg-[#00AFD2] px-4 py-2.5 font-heading text-[13px] font-semibold text-white">
                Inviter à postuler
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ──────────────────────────────────────────────── */}
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_280px]">
        {/* Left */}
        <div className="min-w-0 space-y-8">
          {talent.bio && (
            <section aria-labelledby="bio-h">
              <h2 id="bio-h" className="mb-3 font-heading text-base font-semibold text-foreground">
                À propos
              </h2>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                {talent.bio}
              </p>
            </section>
          )}

          {skillsByDomain.size > 0 && (
            <section aria-labelledby="skills-h">
              <h2 id="skills-h" className="mb-4 font-heading text-base font-semibold text-foreground">
                Compétences
              </h2>
              <div className="space-y-4">
                {[...skillsByDomain.values()].map(({ domainName, skills }) => (
                  <div key={domainName}>
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {domainName}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {skills.map(({ name, level }) => (
                        <span
                          key={name}
                          className="rounded-full border border-primary/20 bg-primary/5 px-2.5 py-1 text-xs font-medium text-primary"
                          title={level ?? undefined}
                        >
                          {name}
                          {level && <span className="ml-1 opacity-60 text-[10px]">· {level}</span>}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {experiences.length > 0 && (
            <section aria-labelledby="exp-h">
              <h2 id="exp-h" className="mb-4 font-heading text-base font-semibold text-foreground">
                Expériences
              </h2>
              <ul className="space-y-5" role="list">
                {experiences.map((exp) => (
                  <li key={exp.id} className="relative border-l-2 border-border pl-4">
                    {exp.is_current && (
                      <div aria-hidden className="absolute -left-1 top-1.5 size-2 rounded-full bg-primary" />
                    )}
                    <p className="font-heading text-sm font-semibold text-foreground">{exp.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {exp.company_name}
                      {exp.location ? ` · ${exp.location}` : ''}
                      {' · '}
                      {formatDateRange(exp.start_date, exp.end_date, exp.is_current)}
                    </p>
                    {exp.description && (
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        {exp.description}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {educations.length > 0 && (
            <section aria-labelledby="edu-h">
              <h2 id="edu-h" className="mb-4 font-heading text-base font-semibold text-foreground">
                Formation
              </h2>
              <ul className="space-y-3" role="list">
                {educations.map((edu) => (
                  <li key={edu.id} className="flex items-start gap-3">
                    <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                      <GraduationCap className="size-4 text-muted-foreground" aria-hidden />
                    </div>
                    <div>
                      <p className="font-heading text-sm font-semibold text-foreground">
                        {edu.degree}{edu.field ? ` en ${edu.field}` : ''}
                        {edu.is_apebi_labeled && (
                          <span className="ml-2 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600">
                            APEBI Labellisé
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {edu.institution}
                        {edu.start_year || edu.end_year
                          ? ` · ${edu.start_year ?? ''}${edu.end_year ? ` – ${edu.end_year}` : ''}`
                          : ''}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {!talent.bio && skillsByDomain.size === 0 && experiences.length === 0 && (
            <div className="rounded-xl border-2 border-dashed border-border p-8 text-center">
              <p className="font-heading text-sm font-semibold text-foreground">Profil incomplet</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Ajoutez bio, compétences et expériences pour que les recruteurs trouvent votre profil.
              </p>
              <Link
                href="/talent/profil/modifier"
                className={cn(buttonVariants({ size: 'sm' }), 'mt-4')}
              >
                Compléter mon profil
              </Link>
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <aside className="space-y-4">
          {(talent.remote_preference || talent.expected_salary_range || (talent.job_type?.length ?? 0) > 0) && (
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="mb-3 font-heading text-sm font-semibold text-foreground">Préférences</p>
              <dl className="space-y-2.5 text-xs">
                {talent.remote_preference && (
                  <div>
                    <dt className="text-muted-foreground">Mode de travail</dt>
                    <dd className="mt-0.5 font-medium text-foreground">{talent.remote_preference}</dd>
                  </div>
                )}
                {talent.expected_salary_range && (
                  <div>
                    <dt className="text-muted-foreground">Prétentions salariales</dt>
                    <dd className="mt-0.5 font-medium text-foreground">{talent.expected_salary_range}</dd>
                  </div>
                )}
                {talent.job_type && talent.job_type.length > 0 && (
                  <div>
                    <dt className="mb-1 text-muted-foreground">Contrats recherchés</dt>
                    <dd className="flex flex-wrap gap-1">
                      {talent.job_type.map((t) => (
                        <span key={t} className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                          {t}
                        </span>
                      ))}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          )}

          {(talent.linkedin_url || talent.github_url || talent.portfolio_url) && (
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="mb-3 font-heading text-sm font-semibold text-foreground">Liens</p>
              <div className="flex flex-col gap-2">
                {talent.linkedin_url && (
                  <a href={talent.linkedin_url} target="_blank" rel="noopener noreferrer"
                    className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'justify-start gap-1.5 text-xs')}>
                    <ExternalLink className="size-3.5" aria-hidden />LinkedIn
                  </a>
                )}
                {talent.github_url && (
                  <a href={talent.github_url} target="_blank" rel="noopener noreferrer"
                    className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'justify-start gap-1.5 text-xs')}>
                    <Code2 className="size-3.5" aria-hidden />GitHub
                  </a>
                )}
                {talent.portfolio_url && (
                  <a href={talent.portfolio_url} target="_blank" rel="noopener noreferrer"
                    className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'justify-start gap-1.5 text-xs')}>
                    <Globe className="size-3.5" aria-hidden />Portfolio
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Note de confidentialité */}
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="font-heading text-[12px] font-semibold text-amber-800">Ce que les recruteurs voient</p>
            <p className="mt-1 text-[11px] text-amber-700 leading-relaxed">
              Votre email n&apos;est jamais affiché. Les recruteurs peuvent vous contacter via le bouton
              &ldquo;Inviter à postuler&rdquo; uniquement si votre profil est visible.
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}
