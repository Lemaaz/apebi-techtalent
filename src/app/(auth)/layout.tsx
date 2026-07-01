import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

const LOGO_COLORS = [
  '#00AFD2', '#EF4444', '#F59E0B',
  '#10B981', '#8B5CF6', '#00AFD2',
  '#F59E0B', '#00AFD2', '#EF4444',
]

function formatCount(n: number): string {
  if (n >= 1000) return `${Math.floor(n / 100) / 10}k+`
  if (n >= 100) return `${n}+`
  return n > 0 ? `${n}+` : '0'
}

const STAT_FLOORS = { companies: 260, talents: 1200, jobs: 85 }

function displayCount(n: number | null, floor: number): string {
  return formatCount(Math.max(n ?? 0, floor))
}

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  const [
    { count: companyCount },
    { count: talentCount },
    { count: jobCount },
  ] = await Promise.all([
    supabase.from('company_profiles').select('*', { count: 'exact', head: true }).eq('validation_status', 'approved'),
    supabase.from('talent_profiles').select('*', { count: 'exact', head: true }).eq('validation_status', 'approved').eq('visibility', true),
    supabase.from('job_postings').select('*', { count: 'exact', head: true }).eq('status', 'active'),
  ])

  const DARK_STATS = [
    { value: displayCount(companyCount, STAT_FLOORS.companies), label: 'entreprises membres' },
    { value: displayCount(talentCount, STAT_FLOORS.talents), label: 'profils talents' },
    { value: displayCount(jobCount, STAT_FLOORS.jobs), label: 'offres actives' },
  ]
  return (
    <div className="flex min-h-dvh">
      {/* ── Left column — dark réseau APEBI ────────────────── */}
      <div className="hidden flex-col justify-between bg-[var(--apebi-dark-90)] px-10 py-10 lg:flex lg:w-[46%] xl:w-1/2">
        {/* Logo */}
        <Link href="/" className="inline-flex items-center gap-2">
          <div aria-hidden className="grid h-7 w-7 grid-cols-3 gap-[2px]">
            {LOGO_COLORS.map((c, i) => (
              <span key={i} className="rounded-[2px]" style={{ background: c }} />
            ))}
          </div>
          <span className="font-heading text-sm font-semibold text-white">
            APEBI <span style={{ color: 'var(--apebi-cyan)' }}>Tech</span>Talent
          </span>
        </Link>

        {/* Network SVG */}
        <div className="flex flex-1 items-center justify-center py-8" aria-hidden>
          <svg viewBox="0 0 360 300" xmlns="http://www.w3.org/2000/svg" className="h-[280px] w-[360px] text-[var(--apebi-cyan)]">
            <g stroke="currentColor" strokeWidth="1">
              <line x1="180" y1="150" x2="80" y2="80" opacity="0.18" />
              <line x1="180" y1="150" x2="280" y2="85" opacity="0.18" />
              <line x1="180" y1="150" x2="290" y2="210" opacity="0.18" />
              <line x1="180" y1="150" x2="80" y2="220" opacity="0.18" />
              <line x1="80" y1="80" x2="40" y2="160" opacity="0.12" />
              <line x1="280" y1="85" x2="330" y2="155" opacity="0.12" />
              <line x1="290" y1="210" x2="230" y2="270" opacity="0.12" />
              <line x1="80" y1="220" x2="40" y2="270" opacity="0.10" />
            </g>
            <circle cx="40" cy="160" r="10" fill="currentColor" opacity="0.65" />
            <circle cx="330" cy="155" r="10" fill="currentColor" opacity="0.65" />
            <circle cx="230" cy="270" r="10" fill="currentColor" opacity="0.60" />
            <circle cx="40" cy="270" r="8" fill="currentColor" opacity="0.55" />
            <circle cx="80" cy="80" r="26" fill="#0a1a26" />
            <circle cx="80" cy="80" r="26" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.35" />
            <text x="80" y="84" textAnchor="middle" fill="currentColor" fontSize="8" fontWeight="600" fontFamily="Poppins, sans-serif">DEV</text>
            <circle cx="280" cy="85" r="26" fill="#0a1a26" />
            <circle cx="280" cy="85" r="26" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.35" />
            <text x="280" y="89" textAnchor="middle" fill="currentColor" fontSize="8" fontWeight="600" fontFamily="Poppins, sans-serif">DATA</text>
            <circle cx="290" cy="210" r="26" fill="#0a1a26" />
            <circle cx="290" cy="210" r="26" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.35" />
            <text x="290" y="214" textAnchor="middle" fill="currentColor" fontSize="8" fontWeight="600" fontFamily="Poppins, sans-serif">CYBER</text>
            <circle cx="80" cy="220" r="26" fill="#0a1a26" />
            <circle cx="80" cy="220" r="26" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.35" />
            <text x="80" y="224" textAnchor="middle" fill="currentColor" fontSize="8" fontWeight="600" fontFamily="Poppins, sans-serif">CLOUD</text>
            <circle cx="180" cy="150" r="48" fill="currentColor" opacity="0.04" />
            <circle cx="180" cy="150" r="34" fill="#0a1f2e" />
            <circle cx="180" cy="150" r="34" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.55" />
            <text x="180" y="146" textAnchor="middle" fill="rgba(255,255,255,0.65)" fontSize="7.5" fontFamily="Poppins, sans-serif">APEBI</text>
            <text x="180" y="158" textAnchor="middle" fill="currentColor" fontSize="8.5" fontWeight="700" fontFamily="Poppins, sans-serif">TechTalent</text>
          </svg>
        </div>

        {/* Tagline + stats */}
        <div>
          <p className="mb-6 font-heading text-xl font-bold leading-tight text-white">
            La plateforme tech de référence de{' '}
            <span style={{ color: 'var(--apebi-cyan)' }}>l&apos;écosystème APEBI</span>
          </p>
          <dl className="grid grid-cols-3 gap-4">
            {DARK_STATS.map(({ value, label }) => (
              <div key={label}>
                <dt className="font-heading text-2xl font-bold" style={{ color: 'var(--apebi-cyan)' }}>{value}</dt>
                <dd className="mt-0.5 text-xs text-white/50">{label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {/* ── Right column — white form ───────────────────────── */}
      <div className="flex flex-1 flex-col bg-white">
        {/* Mobile logo */}
        <header className="px-6 py-5 lg:hidden">
          <Link href="/" className="inline-flex items-center gap-2">
            <div aria-hidden className="grid h-7 w-7 grid-cols-3 gap-[2px]">
              {LOGO_COLORS.map((c, i) => (
                <span key={i} className="rounded-[2px]" style={{ background: c }} />
              ))}
            </div>
            <span className="font-heading text-sm font-semibold">
              APEBI <span className="text-primary">Tech</span>Talent
            </span>
          </Link>
        </header>

        <main className="flex flex-1 items-center justify-center px-6 py-8 sm:px-10">
          {children}
        </main>
      </div>
    </div>
  )
}
