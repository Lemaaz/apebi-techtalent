import type { Metadata } from 'next'
import Link from 'next/link'
import { ShieldCheck, ShieldX, ShieldAlert, Building2, User } from 'lucide-react'
import { verifyLabelToken, type LabelStatus } from '@/lib/label'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'

// Page publique de vérification du Label APEBI TechTalent (cible QR code).
// Le statut change rarement → ISR 1h. Révocation forcée via revalidatePath.
export const revalidate = 3600

type Params = Promise<{ token: string }>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { token } = await params
  const result = await verifyLabelToken(token)
  if (!result) return { title: 'Label introuvable' }
  return {
    title: { absolute: `Label APEBI TechTalent — ${result.name}` },
    description: `Vérification du Label APEBI TechTalent de ${result.name}.`,
  }
}

const STATUS_UI: Record<
  LabelStatus,
  { label: string; icon: typeof ShieldCheck; color: string; bg: string; ring: string }
> = {
  valid: {
    label: 'Label valide',
    icon: ShieldCheck,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    ring: 'ring-emerald-500/30',
  },
  expired: {
    label: 'Label expiré',
    icon: ShieldAlert,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    ring: 'ring-amber-500/30',
  },
  revoked: {
    label: 'Label révoqué',
    icon: ShieldX,
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    ring: 'ring-red-500/30',
  },
}

export default async function LabelVerifyPage({ params }: { params: Params }) {
  const { token } = await params
  const result = await verifyLabelToken(token)

  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar />

      <main className="flex-1 px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-md">
          {!result ? (
            // ── Token introuvable / invalide ──
            <div className="rounded-2xl border border-white/8 bg-[#141414] p-8 text-center">
              <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-white/5 ring-1 ring-white/10">
                <ShieldX className="size-7 text-white/40" aria-hidden />
              </div>
              <h1 className="font-heading text-lg font-bold text-white">
                Label introuvable
              </h1>
              <p className="mt-2 text-sm text-white/50">
                Ce code de vérification ne correspond à aucun Label APEBI TechTalent.
                Vérifiez le lien ou le QR code scanné.
              </p>
              <Link
                href="/"
                className="mt-6 inline-flex rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/80 transition-colors hover:bg-white/10 hover:text-white"
              >
                Retour à l&apos;accueil
              </Link>
            </div>
          ) : (
            // ── Résultat de vérification ──
            (() => {
              const ui = STATUS_UI[result.status]
              const StatusIcon = ui.icon
              const TypeIcon = result.type === 'enterprise' ? Building2 : User
              return (
                <div
                  className={`rounded-2xl border border-white/8 bg-[#141414] p-8 text-center ring-1 ${ui.ring}`}
                >
                  <div
                    className={`mx-auto mb-4 flex size-16 items-center justify-center rounded-full ${ui.bg}`}
                  >
                    <StatusIcon className={`size-8 ${ui.color}`} aria-hidden />
                  </div>

                  <p className={`text-xs font-semibold uppercase tracking-wider ${ui.color}`}>
                    {ui.label}
                  </p>

                  <h1 className="mt-2 font-heading text-xl font-bold text-white">
                    {result.name}
                  </h1>

                  <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-white/50">
                    <TypeIcon className="size-3.5" aria-hidden />
                    {result.type === 'enterprise' ? 'Entreprise labellisée' : 'Talent labellisé'}
                  </p>

                  <div className="mt-6 rounded-xl bg-white/5 p-4">
                    <p className="text-[11px] uppercase tracking-wider text-white/40">
                      Label APEBI TechTalent
                    </p>
                    {result.validUntil ? (
                      <p className="mt-1 text-sm text-white/70">
                        {result.status === 'expired' ? 'Expiré le ' : 'Valide jusqu’au '}
                        <span className="font-medium text-white">
                          {new Date(result.validUntil).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </span>
                      </p>
                    ) : (
                      <p className="mt-1 text-sm text-white/70">Sans date d’expiration</p>
                    )}
                  </div>

                  <p className="mt-6 text-xs text-white/35">
                    Vérifié par <span className="text-[#00AFD2]">APEBI TechTalent</span> ·
                    Commission Formation &amp; Talent Tech
                  </p>
                </div>
              )
            })()
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
