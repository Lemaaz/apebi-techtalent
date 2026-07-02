import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  MapPin, Globe, Code2, ExternalLink, GraduationCap, Award, ArrowRight,
} from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/server'
import { cn } from '@/lib/utils'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://apebi-techtalent.vercel.app'

type Params = Promise<{ token: string }>

type PublicTalent = {
  id: string
  first_name: string
  last_name: string
  title: string | null
  bio: string | null
  avatar_url: string | null
  city: string | null
  seniority_level: string | null
  years_experience: number | null
  availability: string | null
  linkedin_url: string | null
  github_url: string | null
  portfolio_url: string | null
  has_techtalent_label: boolean | null
  public_enabled: boolean
  talent_skills: Array<{
    skills: { name: string; domains: { name_fr: string } | null } | null
  }>
  experiences: Array<{
    id: string; company_name: string; title: string; description: string | null
    start_date: string; end_date: string | null; is_current: boolean; location: string | null
  }>
  educations: Array<{
    id: string; institution: string; degree: string | null; field: string | null
    start_year: number | null; end_year: number | null; is_apebi_labeled: boolean
  }>
}

// Lecture via service-role — filtrée strictement sur public_enabled + token.
// Aucune donnée sensible exposée (pas d'email, pas de prétentions salariales).
async function fetchPublicTalent(token: string): Promise<PublicTalent | null> {
  // Valide le format UUID avant la requête (évite les requêtes inutiles)
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token)) return null

  const admin = createAdminClient()
  const { data } = await admin
    .from('talent_profiles')
    .select(
      `id, first_name, last_name, title, bio, avatar_url, city,
       seniority_level, years_experience, availability,
       linkedin_url, github_url, portfolio_url, has_techtalent_label, public_enabled,
       talent_skills ( skills ( name, domains ( name_fr ) ) ),
       experiences ( id, company_name, title, description, start_date, end_date, is_current, location ),
       educations ( id, institution, degree, field, start_year, end_year, is_apebi_labeled )`,
    )
    .eq('public_token', token)
    .eq('public_enabled', true)
    .maybeSingle<PublicTalent>()

  return data ?? null
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { token } = await params
  const talent = await fetchPublicTalent(token)
  if (!talent) return { title: 'Profil introuvable', robots: { index: false } }

  const fullName = `${talent.first_name} ${talent.last_name}`
  return {
    title: { absolute: `${fullName}${talent.title ? ` — ${talent.title}` : ''} | APEBI TechTalent` },
    description: talent.bio?.slice(0, 160) ?? `Profil tech de ${fullName} sur APEBI TechTalent.`,
    openGraph: {
      title: `${fullName}${talent.title ? ` — ${talent.title}` : ''}`,
      description: talent.bio?.slice(0, 160) ?? `Talent tech marocain sur APEBI TechTalent`,
      url: `${APP_URL}/t/${token}`,
      type: 'profile',
    },
    // Profil partagé volontairement → indexable (booste le SEO talents + APEBI)
    robots: { index: true, follow: true },
  }
}

function formatDateRange(start: string, end: string | null, isCurrent: boolean): string {
  const fmt = (d: string) => new Date(d).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })
  if (isCurrent) return `${fmt(start)} – Présent`
  if (!end) return fmt(start)
  return `${fmt(start)} – ${fmt(end)}`
}

const AVATAR_PALETTES = [
  'bg-[var(--apebi-cyan)]/15 text-[var(--apebi-cyan)]',
  'bg-[var(--apebi-navy)]/15 text-[#8b98a5]',
  'bg-emerald-500/15 text-emerald-400',
  'bg-violet-500/15 text-violet-400',
]
function avatarColor(name: string): string {
  let hash = 0
  for (const c of name) hash = (hash * 31 + c.charCodeAt(0)) & 0xffff
  return AVATAR_PALETTES[hash % AVATAR_PALETTES.length]
}

export default async function PublicTalentPage({ params }: { params: Params }) {
  const { token } = await params
  const talent = await fetchPublicTalent(token)
  if (!talent) notFound()

  const fullName = `${talent.first_name} ${talent.last_name}`
  const initials = `${talent.first_name[0] ?? ''}${talent.last_name[0] ?? ''}`.toUpperCase()

  type DomainGroup = { domainName: string; skills: string[] }
  const skillsByDomain = new Map<string, DomainGroup>()
  for (const ts of talent.talent_skills ?? []) {
    if (!ts.skills) continue
    const domainName = ts.skills.domains?.name_fr ?? 'Autres'
    if (!skillsByDomain.has(domainName)) skillsByDomain.set(domainName, { domainName, skills: [] })
    skillsByDomain.get(domainName)!.skills.push(ts.skills.name)
  }

  const experiences = [...(talent.experiences ?? [])].sort((a, b) => {
    if (a.is_current && !b.is_current) return -1
    if (!a.is_current && b.is_current) return 1
    return new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
  })
  const educations = [...(talent.educations ?? [])].sort((a, b) => (b.end_year ?? 9999) - (a.end_year ?? 9999))

  return (
    <div className="min-h-dvh bg-[var(--apebi-dark-90)] text-white">
      {/* ── Barre APEBI ── */}
      <header className="border-b border-white/8">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/" className="font-heading text-[15px] font-bold">
            APEBI <span className="text-[var(--apebi-cyan)]">Tech</span>Talent
          </Link>
          <Link
            href="/offres"
            className="rounded-lg border border-white/15 px-3 py-1.5 text-[12px] font-semibold text-white/70 transition-colors hover:border-[var(--apebi-cyan)]/40 hover:text-[var(--apebi-cyan)]"
          >
            Voir les offres
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        {/* ── Header profil ── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-4">
            {talent.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={talent.avatar_url} alt={fullName} className="size-20 shrink-0 rounded-2xl object-cover" />
            ) : (
              <div className={cn('flex size-20 shrink-0 items-center justify-center rounded-2xl font-heading text-2xl font-bold', avatarColor(fullName))}>
                {initials}
              </div>
            )}
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-heading text-2xl font-bold">{fullName}</h1>
                {talent.has_techtalent_label && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[var(--apebi-cyan)]/15 px-2.5 py-0.5 text-[11px] font-semibold text-[var(--apebi-cyan)]">
                    <Award className="size-3" aria-hidden />
                    Label APEBI
                  </span>
                )}
              </div>
              {talent.title && <p className="mt-0.5 text-[15px] text-white/60">{talent.title}</p>}
              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-white/45">
                {talent.city && <span className="flex items-center gap-1"><MapPin className="size-3" aria-hidden />{talent.city}</span>}
                {talent.seniority_level && <span>{talent.seniority_level}</span>}
                {talent.years_experience != null && <span>{talent.years_experience} an{talent.years_experience > 1 ? 's' : ''} d&apos;exp.</span>}
                {talent.availability && <span className="text-emerald-400">{talent.availability}</span>}
              </div>
            </div>
          </div>

          {/* Liens externes */}
          <div className="flex gap-2">
            {talent.linkedin_url && (
              <a href={talent.linkedin_url} target="_blank" rel="noopener noreferrer"
                 className="inline-flex size-9 items-center justify-center rounded-lg border border-white/15 text-white/50 transition-colors hover:text-[#0A66C2]" aria-label="LinkedIn">
                <ExternalLink className="size-4" aria-hidden />
              </a>
            )}
            {talent.github_url && (
              <a href={talent.github_url} target="_blank" rel="noopener noreferrer"
                 className="inline-flex size-9 items-center justify-center rounded-lg border border-white/15 text-white/50 transition-colors hover:text-white" aria-label="GitHub">
                <Code2 className="size-4" aria-hidden />
              </a>
            )}
            {talent.portfolio_url && (
              <a href={talent.portfolio_url} target="_blank" rel="noopener noreferrer"
                 className="inline-flex size-9 items-center justify-center rounded-lg border border-white/15 text-white/50 transition-colors hover:text-[var(--apebi-cyan)]" aria-label="Portfolio">
                <Globe className="size-4" aria-hidden />
              </a>
            )}
          </div>
        </div>

        {/* ── Bio ── */}
        {talent.bio && (
          <section className="mt-8">
            <h2 className="mb-2 font-heading text-base font-semibold">À propos</h2>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-white/60">{talent.bio}</p>
          </section>
        )}

        {/* ── Compétences ── */}
        {skillsByDomain.size > 0 && (
          <section className="mt-8">
            <h2 className="mb-4 font-heading text-base font-semibold">Compétences</h2>
            <div className="space-y-4">
              {[...skillsByDomain.values()].map(({ domainName, skills }) => (
                <div key={domainName}>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-white/40">{domainName}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {skills.map((name) => (
                      <span key={name} className="badge-tech">{name}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Expériences ── */}
        {experiences.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-4 font-heading text-base font-semibold">Expériences</h2>
            <ul className="space-y-5" role="list">
              {experiences.map((exp) => (
                <li key={exp.id} className="relative border-l-2 border-white/10 pl-4">
                  {exp.is_current && <div aria-hidden className="absolute -left-1 top-1.5 size-2 rounded-full bg-[var(--apebi-cyan)]" />}
                  <p className="font-heading text-sm font-semibold">{exp.title}</p>
                  <p className="mt-0.5 text-xs text-white/45">
                    {exp.company_name}{exp.location ? ` · ${exp.location}` : ''} · {formatDateRange(exp.start_date, exp.end_date, exp.is_current)}
                  </p>
                  {exp.description && <p className="mt-2 text-sm leading-relaxed text-white/55">{exp.description}</p>}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* ── Formation ── */}
        {educations.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-4 font-heading text-base font-semibold">Formation</h2>
            <ul className="space-y-3" role="list">
              {educations.map((edu) => (
                <li key={edu.id} className="flex items-start gap-3">
                  <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/5">
                    <GraduationCap className="size-4 text-white/40" aria-hidden />
                  </div>
                  <div>
                    <p className="font-heading text-sm font-semibold">
                      {edu.degree}{edu.field ? ` en ${edu.field}` : ''}
                      {edu.is_apebi_labeled && (
                        <span className="ml-2 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">APEBI Labellisé</span>
                      )}
                    </p>
                    <p className="text-xs text-white/45">
                      {edu.institution}{edu.start_year || edu.end_year ? ` · ${edu.start_year ?? ''}${edu.end_year ? ` – ${edu.end_year}` : ''}` : ''}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* ── CTA conversion ── */}
        <section
          className="mt-12 rounded-2xl border border-[var(--apebi-cyan)]/20 p-6 text-center"
          style={{ background: 'linear-gradient(135deg, #061622 0%, #003d52 60%, #061622 100%)' }}
        >
          <p className="font-heading text-lg font-bold">Vous recrutez des talents tech au Maroc ?</p>
          <p className="mt-2 text-sm text-white/60">
            APEBI TechTalent connecte les entreprises membres de la fédération aux meilleurs profils tech marocains.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link href="/entreprises/inscription" className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--apebi-cyan)] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--apebi-cyan-dark)]">
              Inscrire mon entreprise
              <ArrowRight className="size-4" aria-hidden />
            </Link>
            <Link href="/inscription" className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10">
              Créer mon profil talent
            </Link>
          </div>
        </section>

        <p className="mt-6 text-center text-[11px] text-white/30">
          Profil public partagé via APEBI TechTalent · <Link href="/" className="text-[var(--apebi-cyan)] hover:underline">apebi-techtalent</Link>
        </p>
      </main>
    </div>
  )
}
