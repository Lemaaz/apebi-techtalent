import type { Metadata } from 'next'
import Link from 'next/link'
import { Users, Building2, Briefcase, Clock, TrendingUp, CheckCircle, Download, ArrowRight } from 'lucide-react'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { AdminKpiCard } from '@/components/admin/admin-kpi-card'

export const metadata: Metadata = { title: 'Dashboard — Admin' }

// ── Weekly candidatures helper ───────────────────────────────────────────────

type WeekBucket = { label: string; shortLabel: string; count: number }

function buildWeeklyBuckets(rows: { created_at: string }[]): WeekBucket[] {
  const now = new Date()
  // 4 buckets: current week + 3 previous weeks (most recent first)
  const buckets: WeekBucket[] = Array.from({ length: 4 }, (_, i) => {
    const end = new Date(now)
    end.setDate(end.getDate() - i * 7)
    const start = new Date(end)
    start.setDate(start.getDate() - 7)
    return {
      label: i === 0 ? 'Cette semaine' : `Il y a ${i} sem.`,
      shortLabel: i === 0 ? 'S0' : `S-${i}`,
      start,
      end,
      count: 0,
    } as WeekBucket & { start: Date; end: Date }
  })

  for (const row of rows) {
    const d = new Date(row.created_at)
    for (const b of buckets as (WeekBucket & { start: Date; end: Date })[]) {
      if (d >= b.start && d < b.end) { b.count++; break }
    }
  }

  return buckets.reverse() // oldest → newest (left to right)
}

export default async function AdminDashboardPage() {
  const supabase = await createClient()

  const since30d = new Date(Date.now() - 30 * 86_400_000).toISOString()

  const adminClient = createAdminClient()

  // Funnel events — 1 GROUP BY via RPC au lieu de 5 COUNT() séparés (T5 eng review)
  const { data: funnelRows } = await adminClient
    .rpc('funnel_event_counts')
    .returns<Array<{ event_type: string; cnt: number }>>()
  const funnel: Record<string, number> = Object.fromEntries(
    (funnelRows ?? []).map(({ event_type, cnt }) => [event_type, cnt])
  )

  const [
    { count: talentsPending },
    { count: companiesPending },
    { count: offresActive },
    { count: totalTalents },
    { count: totalCompanies },
    { count: talentsApproved },
    { count: companiesApproved },
    { data: recentApplications },
  ] = await Promise.all([
    supabase.from('talent_profiles').select('*', { count: 'exact', head: true }).eq('validation_status', 'pending'),
    supabase.from('company_profiles').select('*', { count: 'exact', head: true }).eq('validation_status', 'pending'),
    supabase.from('job_postings').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('talent_profiles').select('*', { count: 'exact', head: true }),
    supabase.from('company_profiles').select('*', { count: 'exact', head: true }),
    supabase.from('talent_profiles').select('*', { count: 'exact', head: true }).eq('validation_status', 'approved'),
    supabase.from('company_profiles').select('*', { count: 'exact', head: true }).eq('validation_status', 'approved'),
    supabase.from('applications').select('created_at').gte('created_at', since30d),
  ])

  const weeklyBuckets = buildWeeklyBuckets(
    (recentApplications ?? []).filter((r): r is { created_at: string } => r.created_at !== null)
  )
  const maxWeekCount = Math.max(...weeklyBuckets.map((b) => b.count), 1)

  const pendingTotal = (talentsPending ?? 0) + (companiesPending ?? 0)

  return (
    <div>
      {/* Page header */}
      <div className="mb-8">
        <h1 className="font-heading text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Vue d'ensemble de la plateforme APEBI TechTalent
        </p>
      </div>

      {/* ── Alerte actions urgentes ── */}
      {pendingTotal > 0 && (
        <div
          className="mb-8 flex items-start gap-3 rounded-xl p-4"
          style={{
            background: 'var(--color-warning-muted)',
            border: '1px solid var(--color-warning)',
          }}
        >
          <Clock
            className="mt-0.5 size-4 shrink-0"
            style={{ color: 'var(--color-warning)' }}
            aria-hidden
          />
          <div className="flex-1">
            <p className="font-heading text-[13px] font-semibold" style={{ color: 'var(--color-warning-text)' }}>
              {pendingTotal} compte{pendingTotal > 1 ? 's' : ''} en attente de validation
            </p>
            <p className="mt-0.5 text-[12px]" style={{ color: 'var(--color-warning-text)' }}>
              {talentsPending ?? 0} talent{(talentsPending ?? 0) > 1 ? 's' : ''} ·{' '}
              {companiesPending ?? 0} entreprise{(companiesPending ?? 0) > 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            {(talentsPending ?? 0) > 0 && (
              <Link
                href="/admin/talents?status=pending"
                className="rounded-lg px-3 py-1.5 font-heading text-[11px] font-semibold text-white transition-colors"
                style={{ background: 'var(--color-warning)' }}
              >
                Voir talents
              </Link>
            )}
            {(companiesPending ?? 0) > 0 && (
              <Link
                href="/admin/entreprises?status=pending"
                className="rounded-lg px-3 py-1.5 font-heading text-[11px] font-semibold text-white transition-colors"
                style={{ background: 'var(--color-warning)' }}
              >
                Voir entreprises
              </Link>
            )}
          </div>
        </div>
      )}

      {/* ── KPI grid — Actions urgentes ── */}
      <section aria-labelledby="kpi-pending-heading">
        <h2
          id="kpi-pending-heading"
          className="mb-3 text-overline"
        >
          Validation en attente
        </h2>
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AdminKpiCard
            label="Talents en attente"
            value={talentsPending ?? 0}
            icon={Users}
            href="/admin/talents?status=pending"
            urgent={(talentsPending ?? 0) > 0}
            sublabel="Inscriptions à valider manuellement"
          />
          <AdminKpiCard
            label="Entreprises en attente"
            value={companiesPending ?? 0}
            icon={Building2}
            href="/admin/entreprises?status=pending"
            urgent={(companiesPending ?? 0) > 0}
            sublabel="Demandes d'adhésion à traiter"
          />
          <AdminKpiCard
            label="Offres actives"
            value={offresActive ?? 0}
            icon={Briefcase}
            href="/admin/offres"
            sublabel="Offres publiées sur la plateforme"
          />
        </div>
      </section>

      {/* ── KPI grid — Vue globale ── */}
      <section aria-labelledby="kpi-global-heading">
        <h2
          id="kpi-global-heading"
          className="mb-3 text-overline"
        >
          Plateforme — Vue globale
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <AdminKpiCard
            label="Talents total"
            value={totalTalents ?? 0}
            icon={Users}
            href="/admin/talents"
            sublabel={`${talentsApproved ?? 0} validés`}
          />
          <AdminKpiCard
            label="Entreprises total"
            value={totalCompanies ?? 0}
            icon={Building2}
            href="/admin/entreprises"
            sublabel={`${companiesApproved ?? 0} validées`}
          />
          <AdminKpiCard
            label="Taux validation talents"
            value={
              (totalTalents ?? 0) > 0
                ? `${Math.round(((talentsApproved ?? 0) / (totalTalents ?? 1)) * 100)}%`
                : '—'
            }
            icon={CheckCircle}
          />
          <AdminKpiCard
            label="Taux validation entreprises"
            value={
              (totalCompanies ?? 0) > 0
                ? `${Math.round(((companiesApproved ?? 0) / (totalCompanies ?? 1)) * 100)}%`
                : '—'
            }
            icon={TrendingUp}
          />
        </div>
      </section>

      {/* ── Raccourcis actions ── */}
      <section aria-labelledby="shortcuts-heading" className="mt-10">
        <h2
          id="shortcuts-heading"
          className="mb-3 text-overline"
        >
          Accès rapides
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { href: '/admin/talents',     label: 'Gérer les talents',      desc: 'Valider, refuser, consulter les profils' },
            { href: '/admin/entreprises', label: 'Gérer les entreprises',  desc: 'Valider les membres APEBI' },
            { href: '/admin/offres',      label: 'Gérer les offres',       desc: 'Modérer les offres d\'emploi publiées' },
          ].map(({ href, label, desc }) => (
            <Link
              key={href}
              href={href}
              className="group rounded-xl p-4 transition-all duration-200 hover:border-[var(--apebi-cyan)] hover:shadow-[var(--shadow-card-hover)]"
              style={{
                background: 'white',
                border: '1px solid var(--apebi-border)',
                boxShadow: 'var(--shadow-card)',
              }}
            >
              <p className="font-heading text-[13px] font-semibold text-foreground group-hover:text-[var(--apebi-cyan)] transition-colors">
                {label}
              </p>
              <p className="mt-1 text-[12px] text-muted-foreground">{desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Candidatures par semaine — ADM-08 ── */}
      <section aria-labelledby="chart-heading" className="mt-10">
        <h2 id="chart-heading" className="mb-3 text-overline">
          Candidatures — 30 derniers jours
        </h2>
        <div
          className="rounded-xl border p-6"
          style={{ background: 'white', border: '1px solid var(--apebi-border)', boxShadow: 'var(--shadow-card)' }}
        >
          {/* Bars */}
          <div className="flex items-end justify-around gap-4" style={{ height: '120px' }}>
            {weeklyBuckets.map((bucket) => {
              const pct = maxWeekCount > 0 ? (bucket.count / maxWeekCount) * 100 : 0
              const barH = Math.max(pct, bucket.count > 0 ? 4 : 0) // min visible height when count > 0
              return (
                <div key={bucket.label} className="flex flex-1 flex-col items-center gap-2">
                  <span
                    className="font-heading text-[11px] font-semibold tabular-nums"
                    style={{ color: bucket.count > 0 ? 'var(--apebi-cyan)' : 'var(--apebi-text-muted)' }}
                  >
                    {bucket.count}
                  </span>
                  <div className="flex w-full items-end" style={{ height: '80px' }}>
                    <div
                      className="w-full rounded-t-md transition-all"
                      style={{
                        height: `${barH}%`,
                        minHeight: bucket.count > 0 ? '4px' : '2px',
                        background: bucket.count > 0
                          ? 'linear-gradient(to top, var(--apebi-cyan), color-mix(in srgb, var(--apebi-cyan) 60%, white))'
                          : 'var(--apebi-border)',
                      }}
                      role="img"
                      aria-label={`${bucket.label} : ${bucket.count} candidature${bucket.count !== 1 ? 's' : ''}`}
                    />
                  </div>
                  <span className="text-center font-sans text-[11px] text-muted-foreground leading-tight">
                    {bucket.label}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Total */}
          <div
            className="mt-4 flex items-center justify-between border-t pt-4"
            style={{ borderColor: 'var(--apebi-border)' }}
          >
            <p className="font-sans text-[12px] text-muted-foreground">
              Total sur 30 jours
            </p>
            <p className="font-heading text-[15px] font-bold text-foreground tabular-nums">
              {weeklyBuckets.reduce((s, b) => s + b.count, 0)} candidatures
            </p>
          </div>
        </div>
      </section>

      {/* ── Funnel KPI nord — mise en relation ── */}
      <section aria-labelledby="funnel-heading" className="mt-10">
        <h2 id="funnel-heading" className="mb-3 text-overline">
          Funnel — KPI nord «&nbsp;Mise en relation&nbsp;»
        </h2>
        <div
          className="rounded-xl border p-6"
          style={{ background: 'white', border: '1px solid var(--apebi-border)', boxShadow: 'var(--shadow-card)' }}
        >
          {/* Étapes du funnel */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { key: 'inscription',         label: 'Inscriptions',       color: '#94a3b8' },
              { key: 'candidature_envoyee', label: 'Candidatures',       color: '#00AFD2' },
              { key: 'candidature_vue',     label: 'Vues recruteur',     color: '#3b82f6' },
              { key: 'invitation_envoyee',  label: 'Invitations',        color: '#8b5cf6' },
              { key: 'mise_en_relation',    label: 'Mises en relation',  color: '#10b981' },
            ].map(({ key, label, color }, i, arr) => {
              const count = funnel[key] ?? 0
              const prev  = i > 0 ? (funnel[arr[i - 1].key] ?? 0) : null
              const rate  = prev && prev > 0 ? Math.round((count / prev) * 100) : null
              return (
                <div key={key} className="flex items-center gap-2">
                  <div
                    className="flex min-w-[100px] flex-col items-center justify-center gap-1 rounded-xl border p-4 text-center"
                    style={{ borderColor: color + '40', background: color + '08' }}
                  >
                    <span className="font-heading text-2xl font-bold tabular-nums" style={{ color }}>
                      {count}
                    </span>
                    <span className="font-heading text-[11px] font-medium text-muted-foreground leading-tight">
                      {label}
                    </span>
                    {rate !== null && (
                      <span className="mt-0.5 rounded-full px-1.5 py-0.5 font-heading text-[10px] font-semibold" style={{ background: color + '15', color }}>
                        {rate}% conv.
                      </span>
                    )}
                  </div>
                  {i < arr.length - 1 && (
                    <ArrowRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                  )}
                </div>
              )
            })}
          </div>

          {/* KPI nord */}
          <div
            className="mt-5 flex items-center justify-between rounded-lg border-t pt-4"
            style={{ borderColor: 'var(--apebi-border)' }}
          >
            <div>
              <p className="font-sans text-[12px] text-muted-foreground">KPI nord — objectif 2 ans</p>
              <p className="mt-0.5 font-heading text-[13px] font-semibold text-foreground">
                Mises en relation tracées
              </p>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-heading text-2xl font-bold text-emerald-600 tabular-nums">
                {funnel['mise_en_relation'] ?? 0}
              </span>
              <span className="font-heading text-[13px] text-muted-foreground">/ 500</span>
            </div>
          </div>

          {funnel['mise_en_relation'] === 0 && (
            <p className="mt-3 text-center text-[12px] text-muted-foreground">
              Les événements seront enregistrés dès les premières actions sur la plateforme.
            </p>
          )}
        </div>
      </section>

      {/* ── Export CSV — ADM-07 ── */}
      <section aria-labelledby="export-heading" className="mt-10">
        <h2 id="export-heading" className="mb-3 text-overline">
          Export CSV
        </h2>
        <div className="flex flex-wrap gap-3">
          <a
            href="/api/admin/export?type=talents"
            download
            className="flex items-center gap-2 rounded-lg border px-4 py-2 font-heading text-[13px] font-semibold text-foreground transition-colors hover:border-[var(--apebi-cyan)] hover:text-[var(--apebi-cyan)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--apebi-cyan)]"
            style={{ borderColor: 'var(--apebi-border)' }}
          >
            <Download className="size-4" aria-hidden />
            Exporter les talents (.csv)
          </a>
          <a
            href="/api/admin/export?type=offres"
            download
            className="flex items-center gap-2 rounded-lg border px-4 py-2 font-heading text-[13px] font-semibold text-foreground transition-colors hover:border-[var(--apebi-cyan)] hover:text-[var(--apebi-cyan)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--apebi-cyan)]"
            style={{ borderColor: 'var(--apebi-border)' }}
          >
            <Download className="size-4" aria-hidden />
            Exporter les offres (.csv)
          </a>
        </div>
      </section>
    </div>
  )
}
