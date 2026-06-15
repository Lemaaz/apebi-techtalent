import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  Globe,
  Code2,
  ExternalLink,
  MapPin,
  GraduationCap,
  Briefcase,
  Eye,
  EyeOff,
  UserCircle,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { toggleVisibility } from './actions'

export const metadata: Metadata = {
  title: 'Mon Profil | APEBI TechTalent',
}

// ── Types ────────────────────────────────────────────────────

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
  visibility: boolean
  completeness_score: number
  validation_status: string
  talent_skills: Array<{
    level: string | null
    skills: {
      id: string
      name: string
      domains: { name_fr: string; color: string | null } | null
    } | null
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

// ── Helpers ──────────────────────────────────────────────────

const AVATAR_PALETTES = [
  'bg-primary/10 text-primary',
  'bg-[#3A4652]/10 text-[#3A4652]',
  'bg-emerald-500/10 text-emerald-600',
  'bg-violet-500/10 text-violet-600',
  'bg-amber-500/10 text-amber-600',
  'bg-rose-500/10 text-rose-600',
] as const

function avatarColor(name: string): string {
  let hash = 0
  for (const c of name) hash = (hash * 31 + c.charCodeAt(0)) & 0xffff
  return AVATAR_PALETTES[hash % AVATAR_PALETTES.length]
}

const AVAILABILITY_STYLES: Record<string, string> = {
  Immédiate: 'bg-emerald-500/10 text-emerald-600',
  '1 mois': 'bg-amber-500/10 text-amber-700',
  '3 mois': 'bg-orange-500/10 text-orange-700',
  'Non disponible': 'bg-muted text-muted-foreground',
}

function formatDateRange(start: string, end: string | null, isCurrent: boolean): string {
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })
  if (isCurrent) return `${fmt(start)} – Présent`
  if (!end) return fmt(start)
  return `${fmt(start)} – ${fmt(end)}`
}

// ── Sub-components ───────────────────────────────────────────

function CompletenessBar({ score }: { score: number }) {
  const color =
    score >= 80 ? 'bg-emerald-500' : score >= 50 ? 'bg-primary' : 'bg-amber-500'
  return (
    <div className="flex items-center gap-3">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
        <div
          className={cn('h-full rounded-full transition-all', color)}
          style={{ width: `${score}%` }}
          role="progressbar"
          aria-valuenow={score}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      <span className="shrink-0 text-xs font-medium tabular-nums text-muted-foreground">
        {score}%
      </span>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────

export default async function TalentProfilPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { data: talent } = await supabase
    .from('talent_profiles')
    .select(
      `id, first_name, last_name, title, bio, avatar_url,
       city, country, linkedin_url, github_url, portfolio_url,
       years_experience, seniority_level, availability, job_type,
       remote_preference, expected_salary_range, visibility,
       completeness_score, validation_status,
       talent_skills (
         level,
         skills ( id, name,
           domains ( name_fr, color )
         )
       ),
       experiences ( id, company_name, title, description, start_date, end_date, is_current, location ),
       educations ( id, institution, degree, field, start_year, end_year, is_apebi_labeled )`,
    )
    .eq('user_id', user.id)
    .maybeSingle<TalentRow>()

  // ── No profile yet → onboarding ──────────────────────────
  if (!talent) {
    return (
      <div className="flex min-h-dvh flex-col">
        <Navbar />
        <main className="flex flex-1 items-center justify-center px-4">
          <div className="mx-auto max-w-sm text-center">
            <div className="mb-4 inline-flex size-14 items-center justify-center rounded-full bg-primary/10">
              <UserCircle className="size-7 text-primary" aria-hidden />
            </div>
            <h1 className="font-heading text-lg font-semibold text-foreground">
              Créez votre profil talent
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Complétez votre profil pour être visible auprès des entreprises membres APEBI.
            </p>
            <Link
              href="/talent/inscription"
              className={cn(buttonVariants({ size: 'sm' }), 'mt-6')}
            >
              Créer mon profil
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  // ── Derived data ─────────────────────────────────────────
  const fullName = `${talent.first_name} ${talent.last_name}`
  const initials =
    `${talent.first_name[0] ?? ''}${talent.last_name[0] ?? ''}`.toUpperCase()

  // Group skills by domain
  type DomainGroup = {
    domainName: string
    skills: Array<{ name: string; level: string | null }>
  }
  const skillsByDomain = new Map<string, DomainGroup>()
  for (const ts of talent.talent_skills ?? []) {
    if (!ts.skills) continue
    const domainName = ts.skills.domains?.name_fr ?? 'Autres'
    if (!skillsByDomain.has(domainName)) {
      skillsByDomain.set(domainName, { domainName, skills: [] })
    }
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

  const hasContent =
    talent.bio || skillsByDomain.size > 0 || experiences.length > 0 || educations.length > 0

  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar />

      <main className="flex-1">
        {/* ── Header ────────────────────────────────── */}
        <div className="border-b border-border bg-muted/30 px-4 py-6 sm:px-6">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              {/* Avatar + identity */}
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
                    {talent.availability && (
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-[11px] font-medium',
                          AVAILABILITY_STYLES[talent.availability] ??
                            'bg-muted text-muted-foreground',
                        )}
                      >
                        {talent.availability}
                      </span>
                    )}
                    {talent.validation_status === 'pending' && (
                      <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                        En attente de validation
                      </span>
                    )}
                    {talent.validation_status === 'rejected' && (
                      <span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-[11px] font-medium text-rose-600">
                        Profil refusé
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
                      <>
                        {talent.city && <span aria-hidden>·</span>}
                        {talent.seniority_level}
                      </>
                    )}
                    {talent.years_experience != null && (
                      <>
                        <span aria-hidden>·</span>
                        {talent.years_experience} an{talent.years_experience > 1 ? 's' : ''}{' '}
                        d&apos;expérience
                      </>
                    )}
                  </p>
                </div>
              </div>

              <Link
                href="/talent/profil/modifier"
                className={cn(
                  buttonVariants({ variant: 'outline', size: 'sm' }),
                  'shrink-0 text-xs',
                )}
              >
                Modifier mon profil
              </Link>
            </div>

            {/* Completeness */}
            <div className="mt-5 max-w-sm">
              <p className="mb-1.5 text-xs text-muted-foreground">
                Complétude du profil
              </p>
              <CompletenessBar score={talent.completeness_score} />
            </div>
          </div>
        </div>

        {/* ── Body — two-column ─────────────────────── */}
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_280px]">
          {/* ── Left — main content ───────────────── */}
          <div className="min-w-0 space-y-8">
            {!hasContent && (
              <div className="flex flex-col items-center rounded-xl border border-dashed border-border py-12 text-center">
                <UserCircle className="mb-3 size-8 text-muted-foreground" aria-hidden />
                <p className="text-sm font-medium text-foreground">Votre profil est incomplet</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Ajoutez votre bio, compétences et expériences pour maximiser vos chances.
                </p>
                <Link
                  href="/talent/profil/modifier"
                  className={cn(buttonVariants({ size: 'sm' }), 'mt-4 text-xs')}
                >
                  Compléter mon profil
                </Link>
              </div>
            )}

            {/* Bio */}
            {talent.bio && (
              <section aria-labelledby="bio-heading">
                <h2
                  id="bio-heading"
                  className="mb-3 font-heading text-base font-semibold text-foreground"
                >
                  À propos
                </h2>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                  {talent.bio}
                </p>
              </section>
            )}

            {/* Skills */}
            {skillsByDomain.size > 0 && (
              <section aria-labelledby="skills-heading">
                <h2
                  id="skills-heading"
                  className="mb-4 font-heading text-base font-semibold text-foreground"
                >
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
                            {level && (
                              <span className="ml-1 opacity-60 text-[10px]">· {level}</span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Experiences */}
            {experiences.length > 0 && (
              <section aria-labelledby="exp-heading">
                <h2
                  id="exp-heading"
                  className="mb-4 font-heading text-base font-semibold text-foreground"
                >
                  Expériences
                </h2>
                <ul className="space-y-5" role="list">
                  {experiences.map((exp) => (
                    <li key={exp.id} className="relative border-l-2 border-border pl-4">
                      {exp.is_current && (
                        <div
                          aria-hidden
                          className="absolute -left-1 top-1.5 size-2 rounded-full bg-primary"
                        />
                      )}
                      <p className="font-heading text-sm font-semibold text-foreground">
                        {exp.title}
                      </p>
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

            {/* Educations */}
            {educations.length > 0 && (
              <section aria-labelledby="edu-heading">
                <h2
                  id="edu-heading"
                  className="mb-4 font-heading text-base font-semibold text-foreground"
                >
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
                          {edu.degree}
                          {edu.field ? ` en ${edu.field}` : ''}
                          {edu.is_apebi_labeled && (
                            <span className="ml-2 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600">
                              APEBI Labellisé
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {edu.institution}
                          {edu.start_year || edu.end_year
                            ? ` · ${edu.start_year ?? ''}${
                                edu.end_year ? ` – ${edu.end_year}` : ''
                              }`
                            : ''}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          {/* ── Right — sidebar ───────────────────── */}
          <aside className="space-y-4">
            {/* Visibility card */}
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="mb-1 font-heading text-sm font-semibold text-foreground">
                Visibilité
              </p>
              <p className="mb-3 text-xs text-muted-foreground">
                {talent.visibility
                  ? 'Votre profil est visible par les recruteurs APEBI.'
                  : 'Votre profil est masqué des recruteurs.'}
              </p>
              <div
                className={cn(
                  'mb-3 flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium',
                  talent.visibility
                    ? 'bg-emerald-500/10 text-emerald-600'
                    : 'bg-muted text-muted-foreground',
                )}
              >
                {talent.visibility ? (
                  <Eye className="size-3.5" aria-hidden />
                ) : (
                  <EyeOff className="size-3.5" aria-hidden />
                )}
                {talent.visibility ? 'Profil visible' : 'Profil masqué'}
              </div>
              <form action={toggleVisibility}>
                <input type="hidden" name="current" value={String(talent.visibility)} />
                <button
                  type="submit"
                  className={cn(
                    buttonVariants({
                      variant: talent.visibility ? 'outline' : 'default',
                      size: 'sm',
                    }),
                    'w-full gap-1.5 text-xs',
                  )}
                >
                  {talent.visibility ? (
                    <>
                      <EyeOff className="size-3.5" aria-hidden />
                      Masquer mon profil
                    </>
                  ) : (
                    <>
                      <Eye className="size-3.5" aria-hidden />
                      Activer la visibilité
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Preferences */}
            {(talent.remote_preference ||
              talent.expected_salary_range ||
              (talent.job_type && talent.job_type.length > 0)) && (
              <div className="rounded-xl border border-border bg-card p-4">
                <p className="mb-3 font-heading text-sm font-semibold text-foreground">
                  Préférences
                </p>
                <dl className="space-y-2.5 text-xs">
                  {talent.remote_preference && (
                    <div>
                      <dt className="text-muted-foreground">Mode de travail</dt>
                      <dd className="mt-0.5 font-medium text-foreground">
                        {talent.remote_preference}
                      </dd>
                    </div>
                  )}
                  {talent.expected_salary_range && (
                    <div>
                      <dt className="text-muted-foreground">Salaire souhaité</dt>
                      <dd className="mt-0.5 font-medium text-foreground">
                        {talent.expected_salary_range}
                      </dd>
                    </div>
                  )}
                  {talent.job_type && talent.job_type.length > 0 && (
                    <div>
                      <dt className="mb-1 text-muted-foreground">Contrats recherchés</dt>
                      <dd className="flex flex-wrap gap-1">
                        {talent.job_type.map((t) => (
                          <span
                            key={t}
                            className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground"
                          >
                            {t}
                          </span>
                        ))}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            )}

            {/* External links */}
            {(talent.linkedin_url || talent.github_url || talent.portfolio_url) && (
              <div className="rounded-xl border border-border bg-card p-4">
                <p className="mb-3 font-heading text-sm font-semibold text-foreground">Liens</p>
                <div className="flex flex-col gap-2">
                  {talent.linkedin_url && (
                    <a
                      href={talent.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        buttonVariants({ variant: 'outline', size: 'sm' }),
                        'justify-start gap-1.5 text-xs',
                      )}
                    >
                      <ExternalLink className="size-3.5" aria-hidden />
                      LinkedIn
                    </a>
                  )}
                  {talent.github_url && (
                    <a
                      href={talent.github_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        buttonVariants({ variant: 'outline', size: 'sm' }),
                        'justify-start gap-1.5 text-xs',
                      )}
                    >
                      <Code2 className="size-3.5" aria-hidden />
                      GitHub
                    </a>
                  )}
                  {talent.portfolio_url && (
                    <a
                      href={talent.portfolio_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        buttonVariants({ variant: 'outline', size: 'sm' }),
                        'justify-start gap-1.5 text-xs',
                      )}
                    >
                      <Globe className="size-3.5" aria-hidden />
                      Portfolio
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Quick nav */}
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="mb-3 font-heading text-sm font-semibold text-foreground">
                Mon espace
              </p>
              <nav className="flex flex-col gap-1">
                <Link
                  href="/talent/candidatures"
                  className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <Briefcase className="size-3.5" aria-hidden />
                  Mes candidatures
                </Link>
                <Link
                  href="/offres"
                  className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <Briefcase className="size-3.5" aria-hidden />
                  Voir les offres
                </Link>
              </nav>
            </div>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  )
}
