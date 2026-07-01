import type { Metadata } from 'next'
import { Users, Building2, Briefcase, TrendingUp, Gift, Activity } from 'lucide-react'
import { AdminKpiCard } from '@/components/admin/admin-kpi-card'
import { getGrowthMetrics } from '@/lib/analytics'

export const metadata: Metadata = { title: 'Croissance — Admin' }

// Étape de funnel d'activation avec taux de conversion vs l'étape précédente
function FunnelStage({ label, value, prev, color }: { label: string; value: number; prev: number | null; color: string }) {
  const rate = prev != null && prev > 0 ? Math.round((value / prev) * 100) : null
  return (
    <div className="flex items-center gap-2">
      <div
        className="flex min-w-[104px] flex-col items-center justify-center gap-1 rounded-xl border p-3 text-center"
        style={{ borderColor: color + '40', background: color + '0a' }}
      >
        <span className="font-heading text-2xl font-bold tabular-nums" style={{ color }}>{value}</span>
        <span className="font-heading text-[11px] font-medium leading-tight text-muted-foreground">{label}</span>
        {rate != null && (
          <span className="rounded-full px-1.5 py-0.5 font-heading text-[10px] font-semibold" style={{ background: color + '15', color }}>
            {rate}%
          </span>
        )}
      </div>
    </div>
  )
}

export default async function AdminAnalyticsPage() {
  const m = await getGrowthMetrics()
  const maxWeek = Math.max(1, ...m.acquisition.weeks.map((w) => w.talents + w.companies))

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-heading text-2xl font-bold text-foreground">Acquisition &amp; Croissance</h1>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Piloter le lancement à la donnée — acquisition, activation, liquidité, rétention.
        </p>
      </div>

      {/* ── Vue d'ensemble ── */}
      <section aria-labelledby="overview-h">
        <h2 id="overview-h" className="mb-3 text-overline">Vue d&apos;ensemble</h2>
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <AdminKpiCard label="Talents validés" value={m.overview.talentsApproved} icon={Users} sublabel={`${m.overview.talentsTotal} au total`} />
          <AdminKpiCard label="Entreprises validées" value={m.overview.companiesApproved} icon={Building2} sublabel={`${m.overview.companiesTotal} au total`} />
          <AdminKpiCard label="Offres actives" value={m.overview.activeJobs} icon={Briefcase} />
          <AdminKpiCard label="Mises en relation" value={`${m.overview.misesEnRelation} / 500`} icon={TrendingUp} sublabel="Objectif nord 2 ans" />
        </div>
      </section>

      {/* ── Acquisition ── */}
      <section aria-labelledby="acq-h" className="mt-6">
        <h2 id="acq-h" className="mb-3 text-overline">Acquisition — 8 dernières semaines</h2>
        <div className="rounded-xl border p-6" style={{ background: 'white', borderColor: 'var(--apebi-border)', boxShadow: 'var(--shadow-card)' }}>
          <div className="flex items-end justify-around gap-3" style={{ height: '140px' }}>
            {m.acquisition.weeks.map((w) => {
              const total = w.talents + w.companies
              const talentH = (w.talents / maxWeek) * 100
              const companyH = (w.companies / maxWeek) * 100
              return (
                <div key={w.label} className="flex flex-1 flex-col items-center gap-2">
                  <span className="font-heading text-[11px] font-semibold tabular-nums" style={{ color: total > 0 ? 'var(--apebi-cyan)' : 'var(--apebi-text-muted)' }}>
                    {total || ''}
                  </span>
                  <div className="flex w-full flex-col items-center justify-end" style={{ height: '90px' }}>
                    {/* Entreprises (navy) empilé sur talents (cyan) */}
                    {w.companies > 0 && (
                      <div className="w-full rounded-t-md" style={{ height: `${Math.max(companyH, 3)}%`, background: 'var(--apebi-navy)' }} title={`${w.companies} entreprise(s)`} />
                    )}
                    {w.talents > 0 && (
                      <div className={w.companies > 0 ? 'w-full' : 'w-full rounded-t-md'} style={{ height: `${Math.max(talentH, 3)}%`, background: 'var(--apebi-cyan)' }} title={`${w.talents} talent(s)`} />
                    )}
                  </div>
                  <span className="text-center font-sans text-[11px] text-muted-foreground">{w.label}</span>
                </div>
              )
            })}
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-4" style={{ borderColor: 'var(--apebi-border)' }}>
            <div className="flex items-center gap-4 text-[12px] text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm" style={{ background: 'var(--apebi-cyan)' }} />Talents</span>
              <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm" style={{ background: 'var(--apebi-navy)' }} />Entreprises</span>
            </div>
            <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
              <Gift className="size-3.5 text-[var(--apebi-cyan)]" aria-hidden />
              <span className="font-heading font-semibold text-foreground">{m.acquisition.referralCount}</span> via parrainage
              {m.acquisition.referralPct > 0 && <span>({m.acquisition.referralPct}% des inscrits)</span>}
            </div>
          </div>
        </div>
      </section>

      {/* ── Activation ── */}
      <section aria-labelledby="act-h" className="mt-8">
        <h2 id="act-h" className="mb-3 text-overline">Activation — le parcours vers la valeur</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Talent */}
          <div className="rounded-xl border p-5" style={{ background: 'white', borderColor: 'var(--apebi-border)', boxShadow: 'var(--shadow-card)' }}>
            <p className="mb-4 font-heading text-[13px] font-semibold text-foreground">Côté talent</p>
            <div className="flex flex-wrap items-center gap-2">
              <FunnelStage label="Inscrits" value={m.activationTalent.inscrits} prev={null} color="#94a3b8" />
              <FunnelStage label="Profil ≥70%" value={m.activationTalent.complets} prev={m.activationTalent.inscrits} color="#00AFD2" />
              <FunnelStage label="1ère candidature" value={m.activationTalent.candidats} prev={m.activationTalent.complets} color="#3b82f6" />
              <FunnelStage label="Vus par recruteur" value={m.activationTalent.vus} prev={m.activationTalent.candidats} color="#10b981" />
            </div>
          </div>
          {/* Entreprise */}
          <div className="rounded-xl border p-5" style={{ background: 'white', borderColor: 'var(--apebi-border)', boxShadow: 'var(--shadow-card)' }}>
            <p className="mb-4 font-heading text-[13px] font-semibold text-foreground">Côté entreprise</p>
            <div className="flex flex-wrap items-center gap-2">
              <FunnelStage label="Inscrites" value={m.activationCompany.inscrites} prev={null} color="#94a3b8" />
              <FunnelStage label="1ère offre" value={m.activationCompany.avecOffre} prev={m.activationCompany.inscrites} color="#00AFD2" />
              <FunnelStage label="1ère candidature" value={m.activationCompany.avecCandidature} prev={m.activationCompany.avecOffre} color="#3b82f6" />
              <FunnelStage label="1ère mise en relation" value={m.activationCompany.avecMatch} prev={m.activationCompany.avecCandidature} color="#10b981" />
            </div>
          </div>
        </div>
      </section>

      {/* ── Engagement / rétention ── */}
      <section aria-labelledby="eng-h" className="mt-8">
        <h2 id="eng-h" className="mb-3 text-overline">Engagement &amp; rétention</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <AdminKpiCard label="Connexions (7j)" value={m.engagement.connexions7d} icon={Activity} />
          <AdminKpiCard label="Connexions (30j)" value={m.engagement.connexions30d} icon={Activity} />
          <AdminKpiCard label="Utilisateurs actifs (7j)" value={m.engagement.actifs7d} icon={Users} />
          <AdminKpiCard label="Utilisateurs actifs (30j)" value={m.engagement.actifs30d} icon={Users} />
        </div>
        <p className="mt-3 flex items-start gap-2 rounded-xl border p-3 text-[12px] leading-relaxed text-muted-foreground" style={{ borderColor: 'var(--apebi-border)', background: 'var(--apebi-bg-alt)' }}>
          <Activity className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          Rétention basée sur l&apos;activité tracée (connexions + événements funnel). Une mesure de sessions/logins complète pourra être ajoutée quand le volume de trafic le justifiera.
        </p>
      </section>
    </div>
  )
}
