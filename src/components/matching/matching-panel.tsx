'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Sparkles, Loader2, ChevronDown, ChevronUp, ExternalLink, ThumbsUp, ThumbsDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import { ScoreBadge, ScoreBar } from './score-badge'
import type { TalentMatchResult, JobMatchResult } from '@/lib/ai-matching'

// ── Recruiter panel: job → talents ───────────────────────────

export function JobMatchingPanel({ jobId }: { jobId: string }) {
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [results, setResults] = useState<TalentMatchResult[]>([])
  const [errorMsg, setErrorMsg] = useState('')

  async function runMatching() {
    setState('loading')
    try {
      const res = await fetch('/api/matching/job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_id: jobId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erreur')
      setResults(data.results)
      setState('done')
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erreur inconnue')
      setState('error')
    }
  }

  return (
    <div className="rounded-2xl border border-white/8 bg-[var(--apebi-dark-74)] p-5">
      {/* Header */}
      <div className="mb-4 flex items-center gap-2.5">
        <div
          className="flex size-8 items-center justify-center rounded-lg"
          style={{ background: 'rgba(0,175,210,0.12)' }}
        >
          <Sparkles className="size-4" style={{ color: 'var(--apebi-cyan)' }} aria-hidden />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="font-heading text-sm font-semibold text-white">Matching IA</p>
            <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium text-amber-400">
              En calibration
            </span>
          </div>
          <p className="text-[11px] text-white/40">Analyse des profils par Claude</p>
        </div>
      </div>

      {state === 'idle' && (
        <div className="text-center">
          <p className="mb-4 text-[13px] text-white/50">
            Trouvez les talents les mieux adaptés à cette offre parmi les profils validés.
          </p>
          <button
            onClick={runMatching}
            className={cn(buttonVariants({ size: 'sm' }), 'gap-1.5')}
          >
            <Sparkles className="size-3.5" aria-hidden />
            Analyser avec l&apos;IA
          </button>
        </div>
      )}

      {state === 'loading' && (
        <div className="flex flex-col items-center gap-3 py-6">
          <Loader2 className="size-6 animate-spin text-white/30" aria-hidden />
          <p className="text-[13px] text-white/40">
            Analyse en cours… <span className="text-white/20">(10-20 s)</span>
          </p>
        </div>
      )}

      {state === 'error' && (
        <div className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-400">
          {errorMsg}
        </div>
      )}

      {state === 'done' && (
        <div className="space-y-3">
          <p className="text-[12px] text-white/40">
            {results.length} profil{results.length !== 1 ? 's' : ''} analysé{results.length !== 1 ? 's' : ''}
            {' '}— triés par score de compatibilité
          </p>

          {results.length === 0 ? (
            <p className="text-center text-[13px] text-white/40 py-4">
              Aucun talent correspondant trouvé pour le moment.
            </p>
          ) : (
            <ul className="space-y-2" role="list">
              {results.map((r) => (
                <TalentMatchItem key={r.talent.id} result={r} />
              ))}
            </ul>
          )}

          <button
            onClick={runMatching}
            className="mt-2 text-[11px] text-white/30 hover:text-white/60 transition-colors"
          >
            Relancer l&apos;analyse
          </button>
        </div>
      )}
    </div>
  )
}

function TalentMatchItem({ result }: { result: TalentMatchResult }) {
  const [expanded, setExpanded] = useState(false)
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null)
  const { talent, score, points_forts, points_attention } = result

  function sendFeedback(value: 'up' | 'down') {
    setFeedback(value)
    // Calibration signal — persistance V1.1
    console.info('[matching-feedback]', { talent_id: talent.id, score, feedback: value })
  }

  return (
    <li className="rounded-xl border border-white/8 bg-white/3 p-3">
      <div className="flex items-start gap-3">
        {/* Avatar placeholder */}
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-semibold text-white/60">
          {talent.first_name[0]}{talent.last_name[0]}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <Link
                href={`/entreprise/talents/${talent.id}`}
                className="font-heading text-[13px] font-semibold text-white hover:text-[var(--apebi-cyan)] transition-colors"
              >
                {talent.first_name} {talent.last_name}
              </Link>
              {talent.title && (
                <p className="text-[11px] text-white/40 truncate">{talent.title}</p>
              )}
            </div>
            <ScoreBadge score={score} />
          </div>

          <ScoreBar score={score} />

          <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] text-white/35">
            {talent.seniority_level && <span>{talent.seniority_level}</span>}
            {talent.years_experience != null && <span>· {talent.years_experience} ans exp.</span>}
            {talent.city && <span>· {talent.city}</span>}
            {talent.availability && <span>· {talent.availability}</span>}
          </div>
        </div>

        <button
          onClick={() => setExpanded((v) => !v)}
          className="shrink-0 rounded p-1 text-white/30 hover:text-white/60 transition-colors"
          aria-label={expanded ? 'Masquer les détails' : 'Voir les détails'}
        >
          {expanded
            ? <ChevronUp className="size-4" aria-hidden />
            : <ChevronDown className="size-4" aria-hidden />}
        </button>
      </div>

      {expanded && (
        <div className="mt-3 space-y-2 border-t border-white/6 pt-3">
          {points_forts.length > 0 && (
            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-400/70">
                Points forts
              </p>
              <ul className="space-y-0.5">
                {points_forts.map((p, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-[12px] text-white/50">
                    <span className="mt-0.5 text-emerald-400">✓</span>
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {points_attention.length > 0 && (
            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-amber-400/70">
                Points d&apos;attention
              </p>
              <ul className="space-y-0.5">
                {points_attention.map((p, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-[12px] text-white/50">
                    <span className="mt-0.5 text-amber-400">!</span>
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="mt-3 flex items-center justify-between">
            <Link
              href={`/entreprise/talents/${talent.id}`}
              className="inline-flex items-center gap-1 text-[11px] text-[var(--apebi-cyan)] hover:opacity-80"
            >
              Voir le profil complet <ExternalLink className="size-3" aria-hidden />
            </Link>
            {feedback === null ? (
              <div className="flex items-center gap-1" title="Ce matching est-il pertinent ?">
                <span className="text-[10px] text-white/25">Pertinent ?</span>
                <button
                  onClick={() => sendFeedback('up')}
                  className="rounded p-1 text-white/25 hover:text-emerald-400 transition-colors"
                  aria-label="Oui, pertinent"
                >
                  <ThumbsUp className="size-3.5" aria-hidden />
                </button>
                <button
                  onClick={() => sendFeedback('down')}
                  className="rounded p-1 text-white/25 hover:text-rose-400 transition-colors"
                  aria-label="Non, pas pertinent"
                >
                  <ThumbsDown className="size-3.5" aria-hidden />
                </button>
              </div>
            ) : (
              <span className="text-[10px] text-white/30">
                {feedback === 'up' ? '✓ Merci' : '✓ Signal envoyé'}
              </span>
            )}
          </div>
        </div>
      )}
    </li>
  )
}

// ── Talent panel: talent → jobs ───────────────────────────────

export function TalentMatchingPanel() {
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [results, setResults] = useState<JobMatchResult[]>([])
  const [errorMsg, setErrorMsg] = useState('')

  async function runMatching() {
    setState('loading')
    try {
      const res = await fetch('/api/matching/talent')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erreur')
      setResults(data.results)
      setState('done')
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erreur inconnue')
      setState('error')
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center gap-2.5">
        <Sparkles className="size-5 text-primary" aria-hidden />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="font-heading text-sm font-semibold">Offres recommandées par l&apos;IA</p>
            <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium text-amber-600">
              En calibration
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground">Matchées sur votre profil par Claude</p>
        </div>
      </div>

      {state === 'idle' && (
        <div className="text-center">
          <p className="mb-4 text-[13px] text-muted-foreground">
            Découvrez les offres actives les mieux adaptées à votre profil et vos compétences.
          </p>
          <button
            onClick={runMatching}
            className={cn(buttonVariants({ size: 'sm' }), 'gap-1.5')}
          >
            <Sparkles className="size-3.5" aria-hidden />
            Trouver mes offres
          </button>
        </div>
      )}

      {state === 'loading' && (
        <div className="flex flex-col items-center gap-3 py-6">
          <Loader2 className="size-6 animate-spin text-muted-foreground" aria-hidden />
          <p className="text-[13px] text-muted-foreground">Analyse en cours… (10-20 s)</p>
        </div>
      )}

      {state === 'error' && (
        <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-600">{errorMsg}</p>
      )}

      {state === 'done' && (
        <div className="space-y-3">
          <p className="text-[12px] text-muted-foreground">
            {results.length} offre{results.length !== 1 ? 's' : ''} analysée{results.length !== 1 ? 's' : ''}
          </p>

          {results.length === 0 ? (
            <p className="text-center text-[13px] text-muted-foreground py-4">
              Aucune offre active correspondante pour le moment.
            </p>
          ) : (
            <ul className="space-y-2" role="list">
              {results.map((r) => (
                <JobMatchItem key={r.job.id} result={r} />
              ))}
            </ul>
          )}

          <button
            onClick={runMatching}
            className="mt-2 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
          >
            Relancer l&apos;analyse
          </button>
        </div>
      )}
    </div>
  )
}

function JobMatchItem({ result }: { result: JobMatchResult }) {
  const [expanded, setExpanded] = useState(false)
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null)
  const { job, score, points_forts, points_attention } = result

  function sendFeedback(value: 'up' | 'down') {
    setFeedback(value)
    console.info('[matching-feedback]', { job_id: job.id, score, feedback: value })
  }

  return (
    <li className="rounded-xl border border-border bg-background/50 p-3">
      <div className="flex items-start gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground">
          {job.company.name[0]}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <Link
                href={`/offres/${job.slug}`}
                className="font-heading text-[13px] font-semibold text-foreground hover:text-primary transition-colors"
              >
                {job.title}
              </Link>
              <p className="text-[11px] text-muted-foreground truncate">{job.company.name}</p>
            </div>
            <ScoreBadge score={score} />
          </div>

          <ScoreBar score={score} />

          <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] text-muted-foreground">
            <span>{job.contract_type}</span>
            {job.seniority_level && <span>· {job.seniority_level}</span>}
            {job.city && <span>· {job.city}</span>}
            {job.remote_policy && <span>· {job.remote_policy}</span>}
          </div>
        </div>

        <button
          onClick={() => setExpanded((v) => !v)}
          className="shrink-0 rounded p-1 text-muted-foreground hover:text-foreground transition-colors"
          aria-label={expanded ? 'Masquer les détails' : 'Voir les détails'}
        >
          {expanded
            ? <ChevronUp className="size-4" aria-hidden />
            : <ChevronDown className="size-4" aria-hidden />}
        </button>
      </div>

      {expanded && (
        <div className="mt-3 space-y-2 border-t border-border pt-3">
          {points_forts.length > 0 && (
            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-600/80">Points forts</p>
              <ul className="space-y-0.5">
                {points_forts.map((p, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-[12px] text-muted-foreground">
                    <span className="mt-0.5 text-emerald-500">✓</span>{p}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {points_attention.length > 0 && (
            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-amber-600/80">Points d&apos;attention</p>
              <ul className="space-y-0.5">
                {points_attention.map((p, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-[12px] text-muted-foreground">
                    <span className="mt-0.5 text-amber-500">!</span>{p}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="mt-3 flex items-center justify-between">
            <Link
              href={`/offres/${job.slug}`}
              className="inline-flex items-center gap-1 text-[11px] text-primary hover:opacity-80"
            >
              Voir l&apos;offre complète <ExternalLink className="size-3" aria-hidden />
            </Link>
            {feedback === null ? (
              <div className="flex items-center gap-1" title="Ce matching est-il pertinent ?">
                <span className="text-[10px] text-muted-foreground">Pertinent ?</span>
                <button
                  onClick={() => sendFeedback('up')}
                  className="rounded p-1 text-muted-foreground hover:text-emerald-500 transition-colors"
                  aria-label="Oui, pertinent"
                >
                  <ThumbsUp className="size-3.5" aria-hidden />
                </button>
                <button
                  onClick={() => sendFeedback('down')}
                  className="rounded p-1 text-muted-foreground hover:text-rose-500 transition-colors"
                  aria-label="Non, pas pertinent"
                >
                  <ThumbsDown className="size-3.5" aria-hidden />
                </button>
              </div>
            ) : (
              <span className="text-[10px] text-muted-foreground">
                {feedback === 'up' ? '✓ Merci' : '✓ Signal envoyé'}
              </span>
            )}
          </div>
        </div>
      )}
    </li>
  )
}
