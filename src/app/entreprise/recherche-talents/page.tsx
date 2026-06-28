import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Search, Users, SlidersHorizontal } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { EmptyState } from '@/components/ui/empty-state'
import { TalentCard, type TalentCardData } from '@/components/talent/talent-card'
import { BookmarkTalentButton } from '@/components/company/bookmark-talent-button'

export const metadata: Metadata = { title: 'Recherche de talents' }

type DomainRow = { id: string; code: string; name_fr: string }

type TalentRow = {
  id: string
  first_name: string
  last_name: string
  title: string | null
  city: string | null
  seniority_level: string | null
  availability: string | null
  avatar_url: string | null
  completeness_score: number | null
  talent_skills: Array<{ skills: { name: string } | null }>
}

type SortOption = 'recent' | 'completeness' | 'available'

type SearchParams = Promise<{
  q?: string
  seniority?: string
  availability?: string
  remote?: string
  domain?: string
  sort?: SortOption
}>

const SENIORITY_OPTIONS = ['Junior', 'Mid', 'Senior', 'Lead', 'Expert']
const AVAILABILITY_OPTIONS = [
  { value: 'Immédiate',      label: 'Disponible' },
  { value: '1 mois',         label: 'Dans 1 mois' },
  { value: '3 mois',         label: 'Dans 3 mois' },
]
const REMOTE_OPTIONS = ['Full remote', 'Hybride', 'Présentiel']

const SELECT_CLS =
  'rounded-lg border bg-card px-3 py-2 font-sans text-[13px] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--apebi-cyan)] focus:border-[var(--apebi-cyan)] cursor-pointer'

export default async function RechercheTalentsPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { data: member } = await supabase
    .from('company_members')
    .select('company_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!member) redirect('/entreprise/dashboard')

  const { q, seniority, availability, remote, domain, sort = 'recent' } = await searchParams

  const { data: allDomains = [] } = await supabase
    .from('domains')
    .select('id, code, name_fr')
    .order('name_fr')

  // ── Build talent query ───────────────────────────────────
  // REC-05 — tri configurable
  const SORT_CONFIG: Record<string, { column: string; ascending: boolean }> = {
    recent:       { column: 'created_at',         ascending: false },
    completeness: { column: 'completeness_score',  ascending: false },
    available:    { column: 'availability',         ascending: true  }, // "Immédiate" < "1 mois" alphabétiquement
  }
  const sortCfg = SORT_CONFIG[sort] ?? SORT_CONFIG.recent

  let query = supabase
    .from('talent_profiles')
    .select(
      `id, first_name, last_name, title, city, seniority_level,
       availability, avatar_url, completeness_score,
       talent_skills ( skills ( name ) )`,
    )
    .eq('validation_status', 'approved')
    .eq('visibility', true)
    .order(sortCfg.column, { ascending: sortCfg.ascending })

  // Recherche élargie : titre + bio + compétences
  if (q) {
    // 1. Talents dont un skill correspond au query
    const { data: skillMatches } = await supabase
      .from('talent_skills')
      .select('talent_id, skills!inner(name)')
      .ilike('skills.name', `%${q}%`)
      .limit(200)
    const skillTalentIds = [...new Set((skillMatches ?? []).map((s: { talent_id: string }) => s.talent_id))]

    // 2. OR(title, bio, skill-ids) — un seul filtre Supabase
    const orParts = [`title.ilike.%${q}%`, `bio.ilike.%${q}%`]
    if (skillTalentIds.length > 0) {
      orParts.push(`id.in.(${skillTalentIds.join(',')})`)
    }
    query = query.or(orParts.join(','))
  }
  if (seniority)    query = query.eq('seniority_level', seniority)
  if (availability) query = query.eq('availability', availability)
  if (remote)       query = query.eq('remote_preference', remote)

  // ENG-10 — domain filter: resolve through skills → talent_skills join
  // Short-circuits to empty result set when domain exists but has no matching talents
  let domainForceEmpty = false

  if (domain) {
    const matchDomain = (allDomains as DomainRow[]).find((d) => d.code === domain)
    if (!matchDomain) {
      domainForceEmpty = true
    } else {
      const { data: domainSkills } = await supabase
        .from('skills').select('id').eq('domain_id', matchDomain.id)
      const skillIds = (domainSkills ?? []).map((s: { id: string }) => s.id)

      if (skillIds.length === 0) {
        domainForceEmpty = true
      } else {
        const { data: talentMatches } = await supabase
          .from('talent_skills').select('talent_id').in('skill_id', skillIds)
        const talentIds = [...new Set((talentMatches ?? []).map((t: { talent_id: string }) => t.talent_id))]

        if (talentIds.length === 0) {
          domainForceEmpty = true
        } else {
          query = query.in('id', talentIds)
        }
      }
    }
  }

  const { data: rawTalents = [] } = domainForceEmpty
    ? { data: [] }
    : await query.limit(50).returns<TalentRow[]>()

  // Fetch saved talent IDs for this company (REC-03)
  const { data: savedRows = [] } = await supabase
    .from('saved_talents')
    .select('talent_id')
    .eq('company_id', member.company_id)
  const savedTalentIds = new Set((savedRows ?? []).map((r: { talent_id: string }) => r.talent_id))

  // Map to TalentCardData
  const talents: TalentCardData[] = (rawTalents ?? []).map((t) => ({
    id: t.id,
    first_name: t.first_name,
    last_name: t.last_name,
    title: t.title,
    city: t.city,
    avatar_url: t.avatar_url,
    skills: (t.talent_skills ?? []).map((ts) => ts.skills?.name).filter(Boolean) as string[],
    availability: t.availability,
    seniority_level: t.seniority_level,
  }))

  const hasFilters = !!(q || seniority || availability || remote || domain || (sort && sort !== 'recent'))
  const resultCount = talents.length

  return (
      <>
        {/* ── Header + search ────────────────────────── */}
        <div
          className="border-b px-4 py-6 sm:px-6"
          style={{ background: 'var(--apebi-bg-alt)', borderColor: 'var(--apebi-border)' }}
        >
          <div className="mx-auto max-w-7xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-overline mb-1">Espace recruteur</p>
                <h1 className="font-heading text-xl font-semibold text-foreground">
                  Recherche de talents
                </h1>
              </div>
              <Link
                href="/entreprise/dashboard"
                className="font-heading text-[12px] font-medium text-muted-foreground hover:text-foreground"
              >
                ← Dashboard
              </Link>
            </div>

            <form method="GET" className="flex flex-col gap-3">
              {/* Search bar */}
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
                <input
                  name="q"
                  defaultValue={q}
                  placeholder="Titre, technologie, rôle…"
                  className="w-full rounded-lg border bg-card py-2.5 pl-9 pr-4 font-sans text-[14px] transition-colors focus:border-[var(--apebi-cyan)] focus:outline-none focus:ring-2 focus:ring-[var(--apebi-cyan)]"
                  style={{ borderColor: 'var(--apebi-border)' }}
                  aria-label="Rechercher un talent"
                />
              </div>

              {/* Filters row */}
              <div className="flex flex-wrap items-center gap-2">
                <SlidersHorizontal className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />

                {(allDomains as DomainRow[]).length > 0 && (
                  <select
                    name="domain"
                    defaultValue={domain ?? ''}
                    className={SELECT_CLS}
                    style={{ borderColor: domain ? 'var(--apebi-cyan)' : 'var(--apebi-border)' }}
                    aria-label="Filtrer par domaine"
                  >
                    <option value="">Tous les domaines</option>
                    {(allDomains as DomainRow[]).map((d) => (
                      <option key={d.code} value={d.code}>{d.name_fr}</option>
                    ))}
                  </select>
                )}

                <select
                  name="seniority"
                  defaultValue={seniority ?? ''}
                  className={SELECT_CLS}
                  style={{ borderColor: seniority ? 'var(--apebi-cyan)' : 'var(--apebi-border)' }}
                  aria-label="Filtrer par niveau"
                >
                  <option value="">Tous les niveaux</option>
                  {SENIORITY_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>

                <select
                  name="availability"
                  defaultValue={availability ?? ''}
                  className={SELECT_CLS}
                  style={{ borderColor: availability ? 'var(--apebi-cyan)' : 'var(--apebi-border)' }}
                  aria-label="Filtrer par disponibilité"
                >
                  <option value="">Toute disponibilité</option>
                  {AVAILABILITY_OPTIONS.map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>

                <select
                  name="remote"
                  defaultValue={remote ?? ''}
                  className={SELECT_CLS}
                  style={{ borderColor: remote ? 'var(--apebi-cyan)' : 'var(--apebi-border)' }}
                  aria-label="Filtrer par mode de travail"
                >
                  <option value="">Tout mode de travail</option>
                  {REMOTE_OPTIONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>

                {/* Tri */}
                <select
                  name="sort"
                  defaultValue={sort ?? 'recent'}
                  className={SELECT_CLS}
                  style={{ borderColor: sort && sort !== 'recent' ? 'var(--apebi-cyan)' : 'var(--apebi-border)' }}
                  aria-label="Trier par"
                >
                  <option value="recent">Plus récents</option>
                  <option value="completeness">Profil le plus complet</option>
                  <option value="available">Disponibilité immédiate</option>
                </select>

                <button
                  type="submit"
                  className="rounded-lg px-4 py-2 font-heading text-[13px] font-semibold text-white transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--apebi-cyan)]"
                  style={{ background: 'var(--apebi-cyan)' }}
                >
                  Rechercher
                </button>

                {hasFilters && (
                  <Link
                    href="/entreprise/recherche-talents"
                    className="rounded-lg border px-3 py-2 font-heading text-[13px] font-medium text-muted-foreground transition-colors hover:bg-card"
                    style={{ borderColor: 'var(--apebi-border)' }}
                  >
                    Réinitialiser
                  </Link>
                )}
              </div>
            </form>

            {/* Result count */}
            <p className="mt-3 font-sans text-[12px] text-muted-foreground">
              <span className="font-semibold text-foreground">{resultCount}</span>{' '}
              profil{resultCount !== 1 ? 's' : ''} disponible{resultCount !== 1 ? 's' : ''}
              {hasFilters && ' (filtrés)'}
            </p>
          </div>
        </div>

        {/* ── Results grid ──────────────────────────── */}
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          {talents.length === 0 ? (
            <EmptyState
              icon={Users}
              title={hasFilters ? 'Aucun profil trouvé' : 'Aucun profil disponible'}
              description={
                hasFilters
                  ? 'Essayez des filtres moins restrictifs ou réinitialisez la recherche.'
                  : 'Les profils talents validés apparaîtront ici.'
              }
              action={
                hasFilters
                  ? { label: 'Réinitialiser les filtres', href: '/entreprise/recherche-talents' }
                  : undefined
              }
              variant={hasFilters ? 'search' : 'default'}
            />
          ) : (
            <ul
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
              role="list"
              aria-label={`${resultCount} profil${resultCount > 1 ? 's' : ''} talents`}
            >
              {talents.map((talent) => (
                <li key={talent.id} className="relative">
                  <TalentCard {...talent} />
                  <div className="absolute right-2 top-2">
                    <BookmarkTalentButton
                      talentId={talent.id}
                      isSaved={savedTalentIds.has(talent.id)}
                      size="sm"
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </>

  )
}
