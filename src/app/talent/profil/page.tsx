import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  Globe, Code2, ExternalLink, MapPin, GraduationCap,
  Briefcase, Eye, EyeOff, UserCircle, Award, Pencil,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { buttonVariants } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { AdminStatusBadge } from '@/components/admin/admin-status-badge'
import { AvailabilityBadge } from '@/components/shared/application-status-badge'
import { TalentMatchingPanel } from '@/components/matching/matching-panel'
import { toggleVisibility } from './actions'
import { cn } from '@/lib/utils'
import { AvatarUploader } from '@/components/talent/avatar-uploader'
import { CvUploader } from '@/components/talent/cv-uploader'

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
  cv_url: string | null
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

const SENIORITY_LABELS: Record<string, string> = {
  junior: 'Junior', mid: 'Confirmé', senior: 'Senior', lead: 'Lead / Expert',
}

function formatDateRange(start: string, end: string | null, isCurrent: boolean): string {
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })
  if (isCurrent) return `${fmt(start)} – Présent`
  if (!end) return fmt(start)
  return `${fmt(start)} – ${fmt(end)}`
}

// ── Completeness bar ─────────────────────────────────────────

function CompletenessBar({ score }: { score: number }) {
  const color =
    score >= 80
      ? 'var(--color-success)'
      : score >= 50
        ? 'var(--apebi-cyan)'
        : 'var(--color-warning)'

  return (
    <div className="flex items-center gap-3">
      <div
        className="h-1.5 flex-1 overflow-hidden rounded-full"
        style={{ background: 'var(--apebi-bg-alt)' }}
        role="progressbar"
        aria-valuenow={score}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Complétude du profil : ${score}%`}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${score}%`, background: color }}
        />
      </div>
      <span className="shrink-0 font-heading text-[12px] font-semibold tabular-nums text-muted-foreground">
        {score}%
      </span>
    </div>
  )
}

// ── Section heading ───────────────────────────────────────────

function SectionHeading({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2
      id={id}
      className="mb-4 flex items-center gap-2 font-heading text-[15px] font-semibold text-foreground"
    >
      {children}
    </h2>
  )
}

// ── Sidebar card ─────────────────────────────────────────────

function SideCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-xl p-4"
      style={{ background: 'white', border: '1px solid var(--apebi-border)', boxShadow: 'var(--shadow-card)' }}
    >
      <p className="mb-3 font-heading text-[13px] font-semibold text-foreground">{title}</p>
      {children}
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────

export default async function TalentProfilPage() {
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
       remote_preference, expected_salary_range, visibility,
       cv_url, completeness_score, validation_status,
       talent_skills (
         level,
         skills ( id, name, domains ( name_fr, color ) )
       ),
       experiences ( id, company_name, title, description, start_date, end_date, is_current, location ),
       educations ( id, institution, degree, field, start_year, end_year, is_apebi_labeled )`,
    )
    .eq('user_id', user.id)
    .maybeSingle<TalentRow>()

  // ── No profile → onboarding ──────────────────────────────
  if (!talent) redirect('/talent/inscription')

  // ── Derived data ─────────────────────────────────────────
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

  const hasContent = talent.bio || skillsByDomain.size > 0 || experiences.length > 0 || educations.length > 0

  return (
    <>
      {/* ── Profile header card ─────────────────────────── */}
      <div
        className="mb-8 rounded-xl border p-5"
        style={{ background: 'var(--apebi-bg-alt)', borderColor: 'var(--apebi-border)' }}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

          {/* Avatar + identity */}
          <div className="flex items-start gap-4">
            <AvatarUploader
              currentUrl={talent.avatar_url}
              fullName={fullName}
              initials={initials}
            />

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-heading text-xl font-bold text-foreground">{fullName}</h1>
                {talent.availability && (
                  <AvailabilityBadge status={talent.availability} />
                )}
                {talent.validation_status !== 'approved' && (
                  <AdminStatusBadge status={talent.validation_status} />
                )}
              </div>

              {talent.title && (
                <p className="mt-0.5 text-[13px] text-muted-foreground">{talent.title}</p>
              )}

              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-muted-foreground">
                {talent.city && (
                  <span className="flex items-center gap-1">
                    <MapPin className="size-3" aria-hidden />
                    {talent.city}
                  </span>
                )}
                {talent.seniority_level && (
                  <span>{SENIORITY_LABELS[talent.seniority_level] ?? talent.seniority_level}</span>
                )}
                {talent.years_experience != null && (
                  <span>{talent.years_experience} an{talent.years_experience > 1 ? 's' : ''} d&apos;expérience</span>
                )}
              </div>
            </div>
          </div>

          {/* Edit CTA */}
          <Link
            href="/talent/profil/modifier"
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'shrink-0 gap-1.5 text-xs')}
          >
            <Pencil className="size-3.5" aria-hidden />
            Modifier mon profil
          </Link>
        </div>

        {/* Completeness bar */}
        <div className="mt-5 max-w-sm">
          <p className="mb-1.5 font-heading text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Complétude du profil
          </p>
          <CompletenessBar score={talent.completeness_score ?? 0} />
        </div>
      </div>

      {/* ── Body — two-column ─────────────────────────── */}
      <div className="grid gap-8 lg:grid-cols-[1fr_280px]">

          {/* ── Left — main content ───────────────────── */}
          <div className="min-w-0 space-y-8">

            {/* Incomplete profile state */}
            {!hasContent && (
              <div style={{ border: '2px dashed var(--apebi-border)', borderRadius: 12 }}>
                <EmptyState
                  icon={UserCircle}
                  title="Votre profil est incomplet"
                  description="Ajoutez votre bio, compétences et expériences pour maximiser vos chances d'être contacté."
                  action={{ label: 'Compléter mon profil', href: '/talent/profil/modifier' }}
                  compact
                />
              </div>
            )}

            {/* Bio */}
            {talent.bio && (
              <section aria-labelledby="bio-heading">
                <SectionHeading id="bio-heading">À propos</SectionHeading>
                <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-muted-foreground">
                  {talent.bio}
                </p>
              </section>
            )}

            {/* Skills */}
            {skillsByDomain.size > 0 && (
              <section aria-labelledby="skills-heading">
                <SectionHeading id="skills-heading">Compétences</SectionHeading>
                <div className="space-y-4">
                  {[...skillsByDomain.values()].map(({ domainName, skills }) => (
                    <div key={domainName}>
                      <p className="text-overline mb-2">{domainName}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {skills.map(({ name, level }) => (
                          <span key={name} className="badge-skill" title={level ?? undefined}>
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
                <SectionHeading id="exp-heading">Expériences</SectionHeading>
                <ul className="space-y-5" role="list">
                  {experiences.map((exp) => (
                    <li
                      key={exp.id}
                      className="relative border-l-2 pl-4"
                      style={{ borderColor: exp.is_current ? 'var(--apebi-cyan)' : 'var(--apebi-border)' }}
                    >
                      {exp.is_current && (
                        <div
                          aria-hidden
                          className="absolute -left-[5px] top-1.5 size-2.5 rounded-full"
                          style={{ background: 'var(--apebi-cyan)' }}
                        />
                      )}
                      <p className="font-heading text-[14px] font-semibold text-foreground">{exp.title}</p>
                      <p className="mt-0.5 text-[12px] text-muted-foreground">
                        {exp.company_name}
                        {exp.location ? ` · ${exp.location}` : ''}
                        {' · '}
                        {formatDateRange(exp.start_date, exp.end_date, exp.is_current)}
                      </p>
                      {exp.description && (
                        <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
                          {exp.description}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Education */}
            {educations.length > 0 && (
              <section aria-labelledby="edu-heading">
                <SectionHeading id="edu-heading">Formation</SectionHeading>
                <ul className="space-y-3" role="list">
                  {educations.map((edu) => (
                    <li key={edu.id} className="flex items-start gap-3">
                      <div
                        className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg"
                        style={{ background: 'var(--apebi-bg-alt)' }}
                        aria-hidden
                      >
                        <GraduationCap className="size-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-heading text-[14px] font-semibold text-foreground">
                          {edu.degree}{edu.field ? ` en ${edu.field}` : ''}
                          {edu.is_apebi_labeled && (
                            <span className="badge-approved ml-2">
                              <Award className="size-3" aria-hidden />
                              APEBI Labellisé
                            </span>
                          )}
                        </p>
                        <p className="text-[12px] text-muted-foreground">
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
          </div>

          {/* ── Right — sidebar ───────────────────────── */}
          <aside className="space-y-4">

            {/* Visibility toggle */}
            <SideCard title="Visibilité">
              <p className="mb-3 text-[12px] text-muted-foreground">
                {talent.visibility
                  ? 'Votre profil est visible par les recruteurs APEBI.'
                  : 'Votre profil est masqué des recruteurs.'}
              </p>
              <div
                className="mb-3 flex items-center gap-1.5 rounded-lg px-3 py-2 font-heading text-[12px] font-semibold"
                style={
                  talent.visibility
                    ? { background: 'var(--color-success-muted)', color: 'var(--color-success-text)' }
                    : { background: 'var(--apebi-bg-alt)', color: 'var(--apebi-text-muted)' }
                }
              >
                {talent.visibility
                  ? <Eye className="size-3.5" aria-hidden />
                  : <EyeOff className="size-3.5" aria-hidden />}
                {talent.visibility ? 'Profil visible' : 'Profil masqué'}
              </div>
              <form action={toggleVisibility}>
                <input type="hidden" name="current" value={String(talent.visibility)} />
                <button
                  type="submit"
                  className={cn(
                    buttonVariants({ variant: talent.visibility ? 'outline' : 'default', size: 'sm' }),
                    'w-full gap-1.5 text-xs',
                  )}
                >
                  {talent.visibility
                    ? <><EyeOff className="size-3.5" aria-hidden />Masquer mon profil</>
                    : <><Eye className="size-3.5" aria-hidden />Activer la visibilité</>}
                </button>
              </form>
            </SideCard>

            {/* Preferences */}
            {(talent.remote_preference || talent.expected_salary_range || (talent.job_type?.length ?? 0) > 0) && (
              <SideCard title="Préférences">
                <dl className="space-y-3 text-[12px]">
                  {talent.remote_preference && (
                    <div>
                      <dt className="text-muted-foreground">Mode de travail</dt>
                      <dd className="mt-0.5 font-medium text-foreground">{talent.remote_preference}</dd>
                    </div>
                  )}
                  {talent.expected_salary_range && (
                    <div>
                      <dt className="text-muted-foreground">Salaire souhaité</dt>
                      <dd className="mt-0.5 font-medium text-foreground">{talent.expected_salary_range}</dd>
                    </div>
                  )}
                  {talent.job_type && talent.job_type.length > 0 && (
                    <div>
                      <dt className="mb-1.5 text-muted-foreground">Contrats recherchés</dt>
                      <dd className="flex flex-wrap gap-1">
                        {talent.job_type.map((t) => (
                          <span key={t} className="badge-contract">{t}</span>
                        ))}
                      </dd>
                    </div>
                  )}
                </dl>
              </SideCard>
            )}

            {/* External links */}
            {(talent.linkedin_url || talent.github_url || talent.portfolio_url) && (
              <SideCard title="Liens">
                <div className="flex flex-col gap-2">
                  {[
                    { url: talent.linkedin_url, label: 'LinkedIn',  icon: ExternalLink },
                    { url: talent.github_url,   label: 'GitHub',    icon: Code2 },
                    { url: talent.portfolio_url, label: 'Portfolio', icon: Globe },
                  ].filter(({ url }) => !!url).map(({ url, label, icon: Icon }) => (
                    <a
                      key={label}
                      href={url!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'justify-start gap-1.5 text-xs')}
                    >
                      <Icon className="size-3.5" aria-hidden />
                      {label}
                    </a>
                  ))}
                </div>
              </SideCard>
            )}

            {/* CV PDF */}
            <SideCard title="Mon CV">
              <CvUploader currentUrl={talent.cv_url} />
            </SideCard>

            {/* Quick nav */}
            <SideCard title="Mon espace">
              <nav className="flex flex-col gap-1">
                {[
                  { href: '/talent/candidatures', label: 'Mes candidatures', icon: Briefcase },
                  { href: '/offres', label: 'Voir les offres', icon: Briefcase },
                ].map(({ href, label, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-[12px] text-muted-foreground transition-colors hover:bg-[var(--apebi-bg-alt)] hover:text-foreground"
                  >
                    <Icon className="size-3.5" aria-hidden />
                    {label}
                  </Link>
                ))}
              </nav>
            </SideCard>
          </aside>
        </div>

      {/* ── Matching IA — offres recommandées ────────────── */}
      {talent.validation_status === 'approved' && (
        <div className="mt-8">
          <TalentMatchingPanel />
        </div>
      )}
    </>
  )
}
