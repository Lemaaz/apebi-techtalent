import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  Briefcase, Bookmark, Eye, EyeOff, CheckCircle, Clock,
  ArrowRight, Plus, AlertTriangle, UserCircle, TrendingUp, Sparkles, MapPin,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Dashboard | APEBI TechTalent' }

// ── Types ────────────────────────────────────────────────────

type TalentRow = {
  id: string
  first_name: string
  last_name: string
  title: string | null
  bio: string | null
  city: string | null
  avatar_url: string | null
  completeness_score: number
  validation_status: string
  visibility: boolean
  availability: string | null
}

type SuggestedJob = {
  id: string
  title: string
  slug: string
  city: string | null
  contract_type: string
  matchCount: number
  company: { name: string; slug: string; logo_url: string | null } | null
}

type ApplicationRow = {
  id: string
  status: string
  created_at: string
  job_postings: {
    title: string
    slug: string
    company_profiles: { name: string; logo_url: string | null } | null
  } | null
}

// ── Helpers ──────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diffDays = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000)
  if (diffDays === 0) return "Aujourd'hui"
  if (diffDays === 1) return 'Hier'
  if (diffDays < 30) return `Il y a ${diffDays} j`
  return `Il y a ${Math.floor(diffDays / 30)} mois`
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  sent:        { label: 'Envoyée',     color: '#3B82F6', bg: '#EFF6FF' },
  viewed:      { label: 'Vue',         color: '#8B5CF6', bg: '#F5F3FF' },
  shortlisted: { label: 'Shortlistée', color: 'var(--apebi-cyan)', bg: 'var(--apebi-cyan-light)' },
  rejected:    { label: 'Refusée',     color: '#EF4444', bg: '#FEE2E2' },
  accepted:    { label: 'Acceptée',    color: '#10B981', bg: '#D1FAE5' },
}

const VALIDATION_CONFIG: Record<string, { label: string; icon: typeof Clock; color: string; bg: string; border: string }> = {
  pending:  { label: 'En attente de validation',  icon: Clock,         color: 'var(--color-warning-text)', bg: 'var(--color-warning-muted)',  border: 'var(--color-warning)' },
  approved: { label: 'Profil validé',             icon: CheckCircle,   color: 'var(--color-success-text)', bg: 'var(--color-success-muted)',  border: 'var(--color-success)' },
  rejected: { label: 'Profil à compléter',        icon: AlertTriangle, color: 'var(--color-error-text)',   bg: 'var(--color-error-muted)',    border: 'var(--color-error)' },
}

// ── Page ─────────────────────────────────────────────────────

export default async function TalentDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { data: talent } = await supabase
    .from('talent_profiles')
    .select('id, first_name, last_name, title, bio, city, avatar_url, completeness_score, validation_status, visibility, availability')
    .eq('user_id', user.id)
    .maybeSingle<TalentRow>()

  const appRole = (user as any).app_metadata?.role as string | undefined
  const role = appRole === 'SUPER_ADMIN' || appRole === 'ADMIN' ? appRole : (user.user_metadata?.role as string | undefined)
  if (role === 'SUPER_ADMIN' || role === 'ADMIN') redirect('/admin')
  if (role === 'entreprise') redirect('/entreprise/dashboard')
  if (!talent) redirect('/talent/inscription')

  // Parallel data fetches
  // ── REC-08 : offres suggérées par skills (0 coût LLM) ───────
  let suggestedJobs: SuggestedJob[] = []
  if (talent.validation_status === 'approved') {
    const { data: talentSkills } = await supabase
      .from('talent_skills')
      .select('skill_id')
      .eq('talent_id', talent.id)

    const skillIds = (talentSkills ?? []).map((s) => s.skill_id)

    if (skillIds.length > 0) {
      // Offres actives avec skills matchants
      const { data: jobSkillMatches } = await supabase
        .from('job_skills')
        .select('job_id')
        .in('skill_id', skillIds)
        .limit(300)

      // Compter les matches par offre
      const matchCountMap: Record<string, number> = {}
      for (const { job_id } of jobSkillMatches ?? []) {
        matchCountMap[job_id] = (matchCountMap[job_id] ?? 0) + 1
      }

      const topJobIds = Object.entries(matchCountMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([id]) => id)

      if (topJobIds.length > 0) {
        // Offres déjà postulées (à exclure)
        const { data: alreadyApplied } = await supabase
          .from('applications')
          .select('job_id')
          .eq('talent_id', talent.id)
        const appliedIds = new Set((alreadyApplied ?? []).map((a) => a.job_id))

        const { data: jobDetails } = await supabase
          .from('job_postings')
          .select('id, title, slug, city, contract_type, company_profiles ( name, slug, logo_url )')
          .in('id', topJobIds)
          .eq('status', 'active')
          .limit(10)
          .returns<Array<{
            id: string; title: string; slug: string; city: string | null; contract_type: string
            company_profiles: { name: string; slug: string; logo_url: string | null } | null
          }>>()

        suggestedJobs = (jobDetails ?? [])
          .filter((j) => !appliedIds.has(j.id))
          .map((j) => ({ ...j, company: j.company_profiles, matchCount: matchCountMap[j.id] ?? 0 }))
          .sort((a, b) => b.matchCount - a.matchCount)
          .slice(0, 5)
      }
    }
  }

  const [
    { data: rawApplications },
    { count: savedCount },
    { count: totalApps },
    { count: activeApps },
  ] = await Promise.all([
    supabase
      .from('applications')
      .select(`id, status, created_at,
               job_postings ( title, slug, company_profiles ( name, logo_url ) )`)
      .eq('talent_id', talent.id)
      .order('created_at', { ascending: false })
      .limit(5)
      .returns<ApplicationRow[]>(),
    supabase
      .from('saved_jobs')
      .select('*', { count: 'exact', head: true })
      .eq('talent_id', talent.id),
    supabase
      .from('applications')
      .select('*', { count: 'exact', head: true })
      .eq('talent_id', talent.id),
    supabase
      .from('applications')
      .select('*', { count: 'exact', head: true })
      .eq('talent_id', talent.id)
      .in('status', ['sent', 'viewed', 'shortlisted']),
  ])

  const applications = rawApplications ?? []
  const score = talent.completeness_score ?? 0
  const validationCfg = VALIDATION_CONFIG[talent.validation_status] ?? VALIDATION_CONFIG.pending
  const ValidationIcon = validationCfg.icon

  // Completeness hints: show which fields are still missing
  const FIELD_HINTS: { key: keyof TalentRow; label: string }[] = [
    { key: 'title',      label: 'Titre professionnel' },
    { key: 'bio',        label: 'Bio / présentation' },
    { key: 'city',       label: 'Ville' },
    { key: 'avatar_url', label: 'Photo de profil' },
  ]
  const missingHints = score < 70
    ? FIELD_HINTS.filter(({ key }) => {
        const v = talent[key]
        return v == null || (typeof v === 'string' && v.trim().length === 0)
      }).map(({ label }) => label)
    : []

  return (
    <>
      {/* ── Page header ── */}
      <div className="mb-8">
        <p className="text-overline mb-1">Espace Talent</p>
        <h1 className="font-heading text-2xl font-bold text-foreground">
          Bonjour, {talent.first_name} 👋
        </h1>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Voici un aperçu de votre activité sur APEBI TechTalent
        </p>
      </div>

      {/* ── Validation status banner ── */}
      <div
        className="mb-6 flex items-start gap-3 rounded-xl p-4"
        style={{
          background: validationCfg.bg,
          border: `1px solid ${validationCfg.border}`,
        }}
      >
        <ValidationIcon
          className="mt-0.5 size-4 shrink-0"
          style={{ color: validationCfg.color }}
          aria-hidden
        />
        <div className="flex-1">
          <p
            className="font-heading text-[13px] font-semibold"
            style={{ color: validationCfg.color }}
          >
            {validationCfg.label}
          </p>
          {talent.validation_status === 'pending' && (
            <p className="mt-0.5 text-[12px]" style={{ color: validationCfg.color }}>
              L'équipe APEBI examine votre profil. Vous serez notifié par email.
            </p>
          )}
          {talent.validation_status === 'rejected' && (
            <p className="mt-0.5 text-[12px]" style={{ color: validationCfg.color }}>
              Complétez votre profil pour qu'il soit soumis à nouveau.{' '}
              <Link href="/talent/profil" className="underline">Modifier mon profil →</Link>
            </p>
          )}
        </div>
        {/* Visibility indicator */}
        <div className="flex shrink-0 items-center gap-1.5 text-[12px]" style={{ color: validationCfg.color }}>
          {talent.visibility ? (
            <><Eye className="size-3.5" aria-hidden /> Visible</>
          ) : (
            <><EyeOff className="size-3.5" aria-hidden /> Masqué</>
          )}
        </div>
      </div>

      {/* ── Completeness CTA banner (pending + score < 70) ── */}
      {talent.validation_status === 'pending' && score < 70 && (
        <div
          className="mb-6 flex items-center justify-between gap-3 rounded-xl p-4"
          style={{ background: '#EFF6FF', border: '1px solid #BFDBFE' }}
        >
          <div className="flex items-center gap-3">
            <TrendingUp className="size-4 shrink-0 text-blue-600" aria-hidden />
            <p className="text-[13px] text-blue-800">
              Améliorez votre score de complétude pour augmenter vos chances d'être contacté.
            </p>
          </div>
          <Link
            href="/talent/profil/modifier"
            className="shrink-0 rounded-lg px-3 py-1.5 font-heading text-[12px] font-semibold text-white transition-colors hover:opacity-90"
            style={{ background: '#2563EB' }}
          >
            Compléter mon profil →
          </Link>
        </div>
      )}

      {/* ── KPI cards ── */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Completeness */}
        <div
          className="rounded-xl border p-5"
          style={{ borderColor: 'var(--apebi-border)', boxShadow: 'var(--shadow-card)' }}
        >
          <div className="mb-3 flex items-center justify-between">
            <div
              className="flex size-9 items-center justify-center rounded-lg"
              style={{ background: 'var(--apebi-cyan-muted)' }}
            >
              <TrendingUp className="size-4" style={{ color: 'var(--apebi-cyan)' }} aria-hidden />
            </div>
            <span
              className="font-heading text-xl font-bold"
              style={{ color: score >= 70 ? 'var(--apebi-cyan)' : 'var(--color-warning)' }}
            >
              {score}%
            </span>
          </div>
          <p className="font-heading text-[13px] font-semibold text-foreground">Complétude profil</p>
          <div
            className="mt-2 h-1.5 overflow-hidden rounded-full"
            style={{ background: 'var(--apebi-border)' }}
            role="progressbar"
            aria-valuenow={score}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${score}%`,
                background: score >= 70 ? 'var(--apebi-cyan)' : 'var(--color-warning)',
              }}
            />
          </div>
          {score < 70 && (
            <>
              <p className="mt-1 text-[11px] text-muted-foreground">Objectif : 70% pour être visible</p>
              {missingHints.length > 0 && (
                <ul className="mt-2 space-y-0.5">
                  {missingHints.map((hint) => (
                    <li key={hint} className="text-[11px] text-muted-foreground">
                      · {hint}
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>

        {/* Total applications */}
        <Link
          href="/talent/candidatures"
          className="group rounded-xl border p-5 transition-all hover:border-[var(--apebi-cyan)] hover:shadow-[var(--shadow-card-hover)]"
          style={{ borderColor: 'var(--apebi-border)', boxShadow: 'var(--shadow-card)' }}
        >
          <div className="mb-3 flex items-center gap-2">
            <div
              className="flex size-9 items-center justify-center rounded-lg"
              style={{ background: 'var(--apebi-cyan-muted)' }}
            >
              <Briefcase className="size-4" style={{ color: 'var(--apebi-cyan)' }} aria-hidden />
            </div>
          </div>
          <p className="font-heading text-2xl font-bold text-foreground">{totalApps ?? 0}</p>
          <p className="mt-0.5 font-heading text-[13px] font-medium text-muted-foreground">
            Candidatures totales
          </p>
          <p className="mt-0.5 text-[12px] text-muted-foreground">
            {activeApps ?? 0} en cours
          </p>
        </Link>

        {/* Saved jobs */}
        <Link
          href="/talent/offres-sauvegardees"
          className="group rounded-xl border p-5 transition-all hover:border-[var(--apebi-cyan)] hover:shadow-[var(--shadow-card-hover)]"
          style={{ borderColor: 'var(--apebi-border)', boxShadow: 'var(--shadow-card)' }}
        >
          <div className="mb-3 flex items-center gap-2">
            <div
              className="flex size-9 items-center justify-center rounded-lg"
              style={{ background: 'var(--apebi-cyan-muted)' }}
            >
              <Bookmark className="size-4" style={{ color: 'var(--apebi-cyan)' }} aria-hidden />
            </div>
          </div>
          <p className="font-heading text-2xl font-bold text-foreground">{savedCount ?? 0}</p>
          <p className="mt-0.5 font-heading text-[13px] font-medium text-muted-foreground">
            Offres sauvegardées
          </p>
        </Link>

        {/* Profile completeness action */}
        <Link
          href="/talent/profil"
          className="group rounded-xl border p-5 transition-all hover:border-[var(--apebi-cyan)] hover:shadow-[var(--shadow-card-hover)]"
          style={{ borderColor: 'var(--apebi-border)', boxShadow: 'var(--shadow-card)' }}
        >
          <div className="mb-3 flex items-center gap-2">
            <div
              className="flex size-9 items-center justify-center rounded-lg"
              style={{ background: 'var(--apebi-cyan-muted)' }}
            >
              <UserCircle className="size-4" style={{ color: 'var(--apebi-cyan)' }} aria-hidden />
            </div>
          </div>
          <p className="font-heading text-[13px] font-semibold text-foreground">Mon Profil</p>
          <p className="mt-0.5 text-[12px] text-muted-foreground">
            {talent.availability ?? 'Disponibilité non renseignée'}
          </p>
          <p
            className="mt-2 font-heading text-[12px] font-medium group-hover:underline"
            style={{ color: 'var(--apebi-cyan)' }}
          >
            Voir mon profil →
          </p>
        </Link>
      </div>

      {/* ── Candidatures récentes ── */}
      <section aria-labelledby="recent-apps-heading">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="recent-apps-heading" className="font-heading text-[15px] font-semibold text-foreground">
            Candidatures récentes
          </h2>
          {applications.length > 0 && (
            <Link
              href="/talent/candidatures"
              className="font-heading text-[12px] font-medium hover:underline"
              style={{ color: 'var(--apebi-cyan)' }}
            >
              Voir toutes →
            </Link>
          )}
        </div>

        {applications.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center rounded-xl p-10 text-center"
            style={{ border: '2px dashed var(--apebi-border)' }}
          >
            <Briefcase className="mb-3 size-8 text-muted-foreground" aria-hidden />
            <p className="font-heading text-[14px] font-semibold text-foreground">
              Aucune candidature pour le moment
            </p>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Parcourez les offres des entreprises membres APEBI
            </p>
            <Link
              href="/offres"
              className={cn(buttonVariants({ size: 'sm' }), 'mt-4 gap-1.5 text-xs')}
            >
              <Plus className="size-3.5" aria-hidden />
              Voir les offres
            </Link>
          </div>
        ) : (
          <ul className="space-y-2" role="list">
            {applications.map((app) => {
              const cfg = STATUS_CONFIG[app.status] ?? STATUS_CONFIG.sent
              const job = app.job_postings
              const company = job?.company_profiles

              return (
                <li key={app.id}>
                  <Link
                    href={`/offres/${job?.slug ?? ''}`}
                    className="flex items-center gap-3 rounded-xl border px-4 py-3 transition-all hover:border-[var(--apebi-cyan)] hover:shadow-[var(--shadow-card-hover)]"
                    style={{ borderColor: 'var(--apebi-border)', background: 'white' }}
                  >
                    {/* Company logo or fallback */}
                    <div
                      className="flex size-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
                      style={{ background: 'var(--apebi-navy)' }}
                    >
                      {company?.name?.slice(0, 2).toUpperCase() ?? '??'}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate font-heading text-[13px] font-semibold text-foreground">
                        {job?.title ?? '—'}
                      </p>
                      <p className="text-[12px] text-muted-foreground">
                        {company?.name ?? '—'} · {timeAgo(app.created_at)}
                      </p>
                    </div>

                    <span
                      className="shrink-0 rounded-full px-2.5 py-1 font-heading text-[11px] font-semibold"
                      style={{ background: cfg.bg, color: cfg.color }}
                    >
                      {cfg.label}
                    </span>

                    <ArrowRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {/* ── Offres recommandées (REC-08 — skill-based, 0 LLM) ── */}
      {suggestedJobs.length > 0 && (
        <section aria-labelledby="rec-heading" className="mt-10">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2
                id="rec-heading"
                className="font-heading text-[15px] font-semibold text-foreground"
              >
                Offres suggérées pour vous
              </h2>
              <span className="rounded-full bg-[var(--apebi-cyan-muted)] px-2 py-0.5 font-heading text-[10px] font-semibold text-[var(--apebi-cyan)]">
                Basées sur vos compétences
              </span>
            </div>
            <Link
              href="/offres"
              className="font-heading text-[12px] font-medium hover:underline"
              style={{ color: 'var(--apebi-cyan)' }}
            >
              Voir toutes →
            </Link>
          </div>

          <ul className="space-y-2" role="list">
            {suggestedJobs.map((job) => (
              <li key={job.id}>
                <Link
                  href={`/offres/${job.slug}`}
                  className="flex items-center gap-3 rounded-xl border px-4 py-3 transition-all hover:border-[var(--apebi-cyan)] hover:shadow-[var(--shadow-card-hover)]"
                  style={{ borderColor: 'var(--apebi-border)', background: 'white' }}
                >
                  {/* Logo ou initiale */}
                  <div
                    className="flex size-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
                    style={{ background: 'var(--apebi-navy)' }}
                    aria-hidden
                  >
                    {job.company?.name?.[0]?.toUpperCase() ?? '?'}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-heading text-[13px] font-semibold text-foreground">
                      {job.title}
                    </p>
                    <p className="text-[12px] text-muted-foreground">
                      {job.company?.name ?? '—'}
                      {job.city ? (
                        <> · <MapPin className="inline size-2.5" aria-hidden /> {job.city}</>
                      ) : null}
                      {' · '}{job.contract_type}
                    </p>
                  </div>

                  {/* Match badge */}
                  <div className="flex shrink-0 items-center gap-2">
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-heading text-[11px] font-semibold"
                      style={{ background: 'var(--apebi-cyan-muted)', color: 'var(--apebi-cyan)' }}
                    >
                      <Sparkles className="size-2.5" aria-hidden />
                      {job.matchCount} skill{job.matchCount > 1 ? 's' : ''}
                    </span>
                    <ArrowRight className="size-4 text-muted-foreground" aria-hidden />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ── Quick actions ── */}
      <section aria-labelledby="quick-actions-heading" className="mt-10">
        <h2 id="quick-actions-heading" className="mb-3 text-overline">
          Actions rapides
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { href: '/offres',              label: 'Parcourir les offres',     desc: 'Explorer les opportunités APEBI' },
            { href: '/talent/profil/modifier', label: 'Compléter mon profil',  desc: 'Augmentez votre score de complétude' },
            { href: '/talent/candidatures', label: 'Suivre mes candidatures',  desc: 'Vérifier les statuts et répondre' },
          ].map(({ href, label, desc }) => (
            <Link
              key={href}
              href={href}
              className="group rounded-xl border p-4 transition-all hover:border-[var(--apebi-cyan)] hover:shadow-[var(--shadow-card-hover)]"
              style={{ background: 'white', border: '1px solid var(--apebi-border)', boxShadow: 'var(--shadow-card)' }}
            >
              <p className="font-heading text-[13px] font-semibold text-foreground transition-colors group-hover:text-[var(--apebi-cyan)]">
                {label}
              </p>
              <p className="mt-1 text-[12px] text-muted-foreground">{desc}</p>
            </Link>
          ))}
        </div>
      </section>
    </>
  )
}
