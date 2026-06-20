import type { Metadata } from 'next'
import Link from 'next/link'
import { Users, Building2, Briefcase, Clock, TrendingUp, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { AdminKpiCard } from '@/components/admin/admin-kpi-card'

export const metadata: Metadata = { title: 'Dashboard — Admin' }

export default async function AdminDashboardPage() {
  const supabase = await createClient()

  const [
    { count: talentsPending },
    { count: companiesPending },
    { count: offresActive },
    { count: totalTalents },
    { count: totalCompanies },
    { count: talentsApproved },
    { count: companiesApproved },
  ] = await Promise.all([
    supabase.from('talent_profiles').select('*', { count: 'exact', head: true }).eq('validation_status', 'pending'),
    supabase.from('company_profiles').select('*', { count: 'exact', head: true }).eq('validation_status', 'pending'),
    supabase.from('job_postings').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('talent_profiles').select('*', { count: 'exact', head: true }),
    supabase.from('company_profiles').select('*', { count: 'exact', head: true }),
    supabase.from('talent_profiles').select('*', { count: 'exact', head: true }).eq('validation_status', 'approved'),
    supabase.from('company_profiles').select('*', { count: 'exact', head: true }).eq('validation_status', 'approved'),
  ])

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
    </div>
  )
}
