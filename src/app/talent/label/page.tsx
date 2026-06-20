import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Award, ShieldCheck, Clock, XCircle, ExternalLink, ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { applyForTalentLabel } from './actions'

export const metadata: Metadata = { title: 'Label APEBI TechTalent | Mon profil' }

type TalentLabel = {
  id: string
  validation_status: string
  completeness_score: number
  has_techtalent_label: boolean
  label_valid_until: string | null
  label_qr_token: string | null
}

type AppRow = { status: string; notes_admin: string | null; submitted_at: string | null }

export default async function TalentLabelPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { data: talent } = await supabase
    .from('talent_profiles')
    .select('id, validation_status, completeness_score, has_techtalent_label, label_valid_until, label_qr_token')
    .eq('user_id', user.id)
    .maybeSingle<TalentLabel>()

  if (!talent) redirect('/talent/inscription')

  // Dernier dossier déposé
  const { data: lastApp } = await supabase
    .from('label_applications')
    .select('status, notes_admin, submitted_at')
    .eq('talent_id', talent.id)
    .order('submitted_at', { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle<AppRow>()

  const isEligible = talent.validation_status === 'approved' && talent.completeness_score >= 70
  const hasActiveApp = lastApp?.status === 'submitted' || lastApp?.status === 'under_review'
  const isRejected = lastApp?.status === 'rejected'

  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar />

      <main className="flex-1 px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-2xl">
          <Link
            href="/talent/profil"
            className="mb-6 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" aria-hidden />
            Mon profil
          </Link>

          <div className="mb-8">
            <h1 className="flex items-center gap-2 font-heading text-2xl font-bold text-foreground">
              <Award className="size-6 text-[var(--apebi-cyan)]" aria-hidden />
              Label APEBI TechTalent
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Le Label distingue les talents dont le profil et les compétences sont reconnus
              par la Commission Formation &amp; Talent Tech de l&apos;APEBI (Axe B).
            </p>
          </div>

          {/* ── Carte d'état ── */}
          {talent.has_techtalent_label ? (
            // ✅ Labellisé
            <div className="rounded-2xl border border-[var(--color-success)]/30 bg-[var(--color-success)]/5 p-6">
              <div className="flex items-start gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[var(--color-success)]/15">
                  <ShieldCheck className="size-6 text-[var(--color-success)]" aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-heading text-lg font-bold text-foreground">
                    Talent Labellisé APEBI
                  </p>
                  {talent.label_valid_until && (
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      Valide jusqu&apos;au{' '}
                      {new Date(talent.label_valid_until).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  )}
                  {talent.label_qr_token && (
                    <Link
                      href={`/label/verify/${talent.label_qr_token}`}
                      className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-[var(--apebi-border)] bg-card px-3 py-2 text-xs font-medium text-foreground hover:bg-[var(--apebi-bg-alt)]"
                    >
                      <ExternalLink className="size-3.5" aria-hidden />
                      Voir ma page de vérification publique
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ) : hasActiveApp ? (
            // ⏳ En cours
            <div className="rounded-2xl border border-[var(--apebi-border)] bg-card p-6 text-center">
              <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-[var(--apebi-cyan-muted)]">
                <Clock className="size-6 text-[var(--apebi-cyan)]" aria-hidden />
              </div>
              <p className="font-heading text-base font-semibold text-foreground">
                Candidature en cours d&apos;examen
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Votre dossier a été transmis à la Commission C5. Vous serez notifié de la décision.
              </p>
            </div>
          ) : (
            // Candidature possible / refus / non éligible
            <div className="rounded-2xl border border-[var(--apebi-border)] bg-card p-6">
              {isRejected && (
                <div className="mb-5 flex items-start gap-3 rounded-xl border border-[var(--color-error)]/30 bg-[var(--color-error-muted)] p-4">
                  <XCircle className="size-4 shrink-0 text-[var(--color-error-text)]" aria-hidden />
                  <div>
                    <p className="text-sm font-semibold text-foreground">Dossier précédent refusé</p>
                    {lastApp?.notes_admin && (
                      <p className="mt-0.5 text-xs text-muted-foreground">{lastApp.notes_admin}</p>
                    )}
                  </div>
                </div>
              )}

              {isEligible ? (
                <>
                  <p className="text-sm text-muted-foreground">
                    Votre profil est éligible. En candidatant, vous soumettez votre dossier à
                    l&apos;examen de la Commission C5. Une fois approuvé, un badge vérifiable
                    (QR code) sera associé à votre profil.
                  </p>
                  <form action={applyForTalentLabel} className="mt-5">
                    <button
                      type="submit"
                      className="inline-flex items-center gap-2 rounded-lg bg-[var(--apebi-cyan)] px-5 py-2.5 font-heading text-sm font-semibold text-white transition-opacity hover:opacity-90"
                    >
                      <Award className="size-4" aria-hidden />
                      {isRejected ? 'Soumettre un nouveau dossier' : 'Candidater au Label'}
                    </button>
                  </form>
                </>
              ) : (
                <div>
                  <p className="text-sm text-muted-foreground">
                    Pour candidater au Label, votre profil doit être :
                  </p>
                  <ul className="mt-3 space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <span className={talent.validation_status === 'approved' ? 'text-[var(--color-success)]' : 'text-muted-foreground'}>
                        {talent.validation_status === 'approved' ? '✓' : '○'}
                      </span>
                      <span className="text-foreground">Validé par l&apos;équipe C5</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className={talent.completeness_score >= 70 ? 'text-[var(--color-success)]' : 'text-muted-foreground'}>
                        {talent.completeness_score >= 70 ? '✓' : '○'}
                      </span>
                      <span className="text-foreground">
                        Complété à 70 % minimum{' '}
                        <span className="text-muted-foreground">
                          (actuellement {talent.completeness_score} %)
                        </span>
                      </span>
                    </li>
                  </ul>
                  <Link
                    href="/talent/profil/modifier"
                    className="mt-5 inline-flex items-center gap-1.5 rounded-lg border border-[var(--apebi-border)] bg-card px-4 py-2 text-xs font-medium text-foreground hover:bg-[var(--apebi-bg-alt)]"
                  >
                    Compléter mon profil
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
