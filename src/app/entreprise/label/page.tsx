import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Award, ShieldCheck, Clock, XCircle, ExternalLink, ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { applyForCompanyLabel } from './actions'

export const metadata: Metadata = { title: 'Label APEBI TechTalent | Mon entreprise' }

type CompanyLabel = {
  id: string
  name: string
  validation_status: string
  has_techtalent_label: boolean
  label_valid_until: string | null
  label_qr_token: string | null
}

type AppRow = { status: string; notes_admin: string | null; submitted_at: string | null }

export default async function CompanyLabelPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { data: membership } = await supabase
    .from('company_members')
    .select(
      `company_id,
       company_profiles ( id, name, validation_status, has_techtalent_label, label_valid_until, label_qr_token )`,
    )
    .eq('user_id', user.id)
    .maybeSingle<{ company_id: string; company_profiles: CompanyLabel | null }>()

  const company = membership?.company_profiles
  if (!company) redirect('/entreprise/dashboard')

  const { data: lastApp } = await supabase
    .from('label_applications')
    .select('status, notes_admin, submitted_at')
    .eq('company_id', company.id)
    .order('submitted_at', { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle<AppRow>()

  const isEligible = company.validation_status === 'approved'
  const hasActiveApp = lastApp?.status === 'submitted' || lastApp?.status === 'under_review'
  const isRejected = lastApp?.status === 'rejected'

  return (
      <div className="px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-2xl">
          <Link
            href="/entreprise/dashboard"
            className="mb-6 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" aria-hidden />
            Tableau de bord
          </Link>

          <div className="mb-8">
            <h1 className="flex items-center gap-2 font-heading text-2xl font-bold text-foreground">
              <Award className="size-6 text-[var(--apebi-cyan)]" aria-hidden />
              Label APEBI TechTalent
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Le Label distingue les entreprises engagées dans le développement des talents tech,
              reconnu par la Commission Formation &amp; Talent Tech de l&apos;APEBI (Axe B).
            </p>
          </div>

          {company.has_techtalent_label ? (
            <div className="rounded-2xl border border-[var(--color-success)]/30 bg-[var(--color-success)]/5 p-6">
              <div className="flex items-start gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[var(--color-success)]/15">
                  <ShieldCheck className="size-6 text-[var(--color-success)]" aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-heading text-lg font-bold text-foreground">
                    Entreprise Labellisée APEBI
                  </p>
                  {company.label_valid_until && (
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      Valide jusqu&apos;au{' '}
                      {new Date(company.label_valid_until).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  )}
                  {company.label_qr_token && (
                    <Link
                      href={`/label/verify/${company.label_qr_token}`}
                      className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-[var(--apebi-border)] bg-card px-3 py-2 text-xs font-medium text-foreground hover:bg-[var(--apebi-bg-alt)]"
                    >
                      <ExternalLink className="size-3.5" aria-hidden />
                      Voir la page de vérification publique
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ) : hasActiveApp ? (
            <div className="rounded-2xl border border-[var(--apebi-border)] bg-card p-6 text-center">
              <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-[var(--apebi-cyan-muted)]">
                <Clock className="size-6 text-[var(--apebi-cyan)]" aria-hidden />
              </div>
              <p className="font-heading text-base font-semibold text-foreground">
                Candidature en cours d&apos;examen
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Le dossier de {company.name} a été transmis à la Commission C5.
              </p>
            </div>
          ) : (
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
                    {company.name} est éligible. En candidatant, vous soumettez votre dossier à
                    l&apos;examen de la Commission C5. Une fois approuvé, le badge vérifiable
                    apparaîtra sur votre vitrine publique.
                  </p>
                  <form action={applyForCompanyLabel} className="mt-5">
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
                    Votre entreprise doit être validée par l&apos;équipe C5 avant de pouvoir
                    candidater au Label.
                  </p>
                  <Link
                    href="/entreprise/dashboard"
                    className="mt-5 inline-flex items-center gap-1.5 rounded-lg border border-[var(--apebi-border)] bg-card px-4 py-2 text-xs font-medium text-foreground hover:bg-[var(--apebi-bg-alt)]"
                  >
                    Retour au tableau de bord
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

  )
}
