'use client'

import { useActionState, useTransition, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { Bell, BellOff, Eye, EyeOff, Lock, Trash2, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react'
import { changePassword, toggleVisibilityFromParams, toggleAlertsFromParams, deleteAccount, type PwdState, type DeleteState } from './actions'

// ── Submit helpers ────────────────────────────────────────────

function SubmitBtn({ label, pendingLabel, danger = false }: { label: string; pendingLabel: string; danger?: boolean }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className={[
        'flex items-center gap-2 rounded-lg px-4 py-2 font-heading text-[13px] font-semibold transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2',
        danger
          ? 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500'
          : 'text-white hover:opacity-90 focus-visible:ring-[var(--apebi-cyan)]',
      ].join(' ')}
      style={!danger ? { background: 'var(--apebi-cyan)' } : undefined}
    >
      {pending && <Loader2 className="size-3.5 animate-spin" aria-hidden />}
      {pending ? pendingLabel : label}
    </button>
  )
}

function SectionCard({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div
      className="rounded-xl border p-6"
      style={{ background: 'var(--background)', borderColor: 'var(--apebi-border)' }}
    >
      <div className="mb-5 flex items-center gap-2">
        <Icon className="size-4 text-[var(--apebi-cyan)]" aria-hidden />
        <h2 className="font-heading text-[15px] font-semibold text-foreground">{title}</h2>
      </div>
      {children}
    </div>
  )
}

const INPUT_CLS = 'w-full rounded-lg border bg-card px-3 py-2 font-sans text-[13px] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--apebi-cyan)] focus:border-[var(--apebi-cyan)]'
const LABEL_CLS = 'mb-1 block font-heading text-[12px] font-medium text-muted-foreground'

// ── Main client component ────────────────────────────────────

export function ParametresClient({
  email,
  visibility,
  receiveAlerts,
}: {
  email: string
  visibility: boolean
  receiveAlerts: boolean
}) {
  const initPwd: PwdState = { error: null, success: false }
  const initDel: DeleteState = { error: null }

  const [pwdState, pwdAction] = useActionState(changePassword, initPwd)
  const [delState, delAction] = useActionState(deleteAccount, initDel)

  const [visibilityState, setVisibilityState] = useState(visibility)
  const [visTransition, startVisTransition] = useTransition()

  const [alertsState, setAlertsState] = useState(receiveAlerts)
  const [alertsTransition, startAlertsTransition] = useTransition()

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  function handleToggleVisibility() {
    startVisTransition(async () => {
      await toggleVisibilityFromParams(visibilityState)
      setVisibilityState(!visibilityState)
    })
  }

  function handleToggleAlerts() {
    startAlertsTransition(async () => {
      await toggleAlertsFromParams(alertsState)
      setAlertsState(!alertsState)
    })
  }

  return (
    <div className="space-y-6">

      {/* Email info (read-only) */}
      <SectionCard title="Informations du compte" icon={Lock}>
        <div>
          <label className={LABEL_CLS}>Adresse email</label>
          <p
            className="rounded-lg border px-3 py-2 font-sans text-[13px] text-muted-foreground"
            style={{ background: 'var(--apebi-bg-alt)', borderColor: 'var(--apebi-border)' }}
          >
            {email}
          </p>
          <p className="mt-1 font-sans text-[11px] text-muted-foreground">
            Pour changer votre email, contactez-nous à{' '}
            <a href="mailto:techtalent@apebi.ma" className="text-[var(--apebi-cyan)] hover:underline">
              techtalent@apebi.ma
            </a>
          </p>
        </div>
      </SectionCard>

      {/* Change password */}
      <SectionCard title="Mot de passe" icon={Lock}>
        <form action={pwdAction} className="space-y-4">
          <div>
            <label htmlFor="password" className={LABEL_CLS}>Nouveau mot de passe</label>
            <input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" className={INPUT_CLS} />
          </div>
          <div>
            <label htmlFor="confirm" className={LABEL_CLS}>Confirmer le mot de passe</label>
            <input id="confirm" name="confirm" type="password" required minLength={8} autoComplete="new-password" className={INPUT_CLS} />
          </div>

          {pwdState.error && (
            <p className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 font-sans text-[12px] text-red-600 dark:border-red-900 dark:bg-red-950/20">
              <AlertTriangle className="size-3.5 shrink-0" aria-hidden />
              {pwdState.error}
            </p>
          )}
          {pwdState.success && (
            <p className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 font-sans text-[12px] text-green-700 dark:border-green-900 dark:bg-green-950/20">
              <CheckCircle2 className="size-3.5 shrink-0" aria-hidden />
              Mot de passe mis à jour avec succès.
            </p>
          )}

          <SubmitBtn label="Mettre à jour" pendingLabel="Enregistrement…" />
        </form>
      </SectionCard>

      {/* Visibility */}
      <SectionCard title="Visibilité du profil" icon={visibilityState ? Eye : EyeOff}>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-heading text-[13px] font-medium text-foreground">
              {visibilityState ? 'Profil visible' : 'Profil masqué'}
            </p>
            <p className="mt-0.5 font-sans text-[12px] text-muted-foreground">
              {visibilityState
                ? 'Votre profil est visible par les entreprises APEBI membres.'
                : 'Votre profil est masqué et invisible pour les recruteurs.'}
            </p>
          </div>
          <button
            type="button"
            onClick={handleToggleVisibility}
            disabled={visTransition}
            aria-label={visibilityState ? 'Masquer mon profil' : 'Rendre mon profil visible'}
            className={[
              'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--apebi-cyan)] focus-visible:ring-offset-2 disabled:opacity-50',
              visibilityState ? 'bg-[var(--apebi-cyan)]' : 'bg-muted',
            ].join(' ')}
            role="switch"
            aria-checked={visibilityState}
          >
            <span
              className={[
                'pointer-events-none inline-block size-5 rounded-full bg-white shadow-lg transition-transform duration-200',
                visibilityState ? 'translate-x-5' : 'translate-x-0',
              ].join(' ')}
            />
          </button>
        </div>
      </SectionCard>

      {/* Alertes email */}
      <SectionCard title="Alertes offres par email" icon={alertsState ? Bell : BellOff}>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-heading text-[13px] font-medium text-foreground">
              {alertsState ? 'Alertes activées' : 'Alertes désactivées'}
            </p>
            <p className="mt-0.5 font-sans text-[12px] text-muted-foreground">
              {alertsState
                ? 'Vous êtes notifié par email quand des offres correspondent à vos compétences.'
                : 'Vous ne recevez plus d\'alertes email pour les nouvelles offres.'}
            </p>
          </div>
          <button
            type="button"
            onClick={handleToggleAlerts}
            disabled={alertsTransition}
            aria-label={alertsState ? 'Désactiver les alertes email' : 'Activer les alertes email'}
            className={[
              'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--apebi-cyan)] focus-visible:ring-offset-2 disabled:opacity-50',
              alertsState ? 'bg-[var(--apebi-cyan)]' : 'bg-muted',
            ].join(' ')}
            role="switch"
            aria-checked={alertsState}
          >
            <span
              className={[
                'pointer-events-none inline-block size-5 rounded-full bg-white shadow-lg transition-transform duration-200',
                alertsState ? 'translate-x-5' : 'translate-x-0',
              ].join(' ')}
            />
          </button>
        </div>
      </SectionCard>

      {/* Delete account */}
      <SectionCard title="Supprimer mon compte" icon={Trash2}>
        {!showDeleteConfirm ? (
          <div>
            <p className="mb-4 font-sans text-[13px] text-muted-foreground">
              La suppression est <strong>définitive et irréversible</strong>. Toutes vos données
              (profil, candidatures, CV) seront effacées.
            </p>
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="rounded-lg border border-red-300 px-4 py-2 font-heading text-[13px] font-semibold text-red-600 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 dark:border-red-800 dark:hover:bg-red-950/20"
            >
              Supprimer mon compte
            </button>
          </div>
        ) : (
          <form action={delAction} className="space-y-4">
            <div
              className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950/20"
              role="alert"
            >
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-red-600" aria-hidden />
              <p className="font-sans text-[12px] text-red-700 dark:text-red-400">
                Cette action est irréversible. Tapez <strong>SUPPRIMER</strong> pour confirmer.
              </p>
            </div>
            <div>
              <label htmlFor="confirmation" className={LABEL_CLS}>Confirmation</label>
              <input
                id="confirmation"
                name="confirmation"
                type="text"
                required
                placeholder="SUPPRIMER"
                className={INPUT_CLS}
                autoComplete="off"
              />
            </div>

            {delState.error && (
              <p className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 font-sans text-[12px] text-red-600">
                <AlertTriangle className="size-3.5 shrink-0" aria-hidden />
                {delState.error}
              </p>
            )}

            <div className="flex gap-3">
              <SubmitBtn label="Supprimer définitivement" pendingLabel="Suppression…" danger />
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="rounded-lg border px-4 py-2 font-heading text-[13px] font-medium text-muted-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--apebi-cyan)]"
                style={{ borderColor: 'var(--apebi-border)' }}
              >
                Annuler
              </button>
            </div>
          </form>
        )}
      </SectionCard>

    </div>
  )
}
