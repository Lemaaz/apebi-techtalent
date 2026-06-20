'use client'

import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { Lock, Bell, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react'
import { changePassword, toggleNotifyOnApplication, type PwdState, type NotifyState } from './actions'

// ── Submit button ─────────────────────────────────────────────

function SubmitBtn({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex items-center gap-2 rounded-lg px-4 py-2 font-heading text-[13px] font-semibold text-white transition-colors hover:opacity-90 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--apebi-cyan)]"
      style={{ background: 'var(--apebi-cyan)' }}
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

// ── Main client component ─────────────────────────────────────

export function EntrepriseParametresClient({
  email,
  notifyOnApplication,
}: {
  email: string
  notifyOnApplication: boolean
}) {
  const initPwd: PwdState = { error: null, success: false }
  const initNotify: NotifyState = { error: null, success: false }

  const [pwdState, pwdAction] = useActionState(changePassword, initPwd)
  const [notifyState, notifyAction] = useActionState(toggleNotifyOnApplication, initNotify)
  const [notifyChecked, setNotifyChecked] = useState(notifyOnApplication)

  return (
    <div className="space-y-6">

      {/* Email (read-only) */}
      <SectionCard title="Informations du compte" icon={Lock}>
        <div className="space-y-4">
          <div>
            <p className={LABEL_CLS}>Email</p>
            <p
              className="rounded-lg border px-3 py-2 font-sans text-[13px] text-muted-foreground"
              style={{ borderColor: 'var(--apebi-border)', background: 'var(--apebi-bg-alt)' }}
            >
              {email}
            </p>
          </div>
        </div>
      </SectionCard>

      {/* Password change */}
      <SectionCard title="Sécurité" icon={Lock}>
        <form action={pwdAction} className="space-y-4">
          <div>
            <label htmlFor="password" className={LABEL_CLS}>Nouveau mot de passe</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              placeholder="8 caractères minimum"
              className={INPUT_CLS}
              style={{ borderColor: 'var(--apebi-border)' }}
            />
          </div>
          <div>
            <label htmlFor="confirm" className={LABEL_CLS}>Confirmer le mot de passe</label>
            <input
              id="confirm"
              name="confirm"
              type="password"
              autoComplete="new-password"
              required
              placeholder="Répétez le mot de passe"
              className={INPUT_CLS}
              style={{ borderColor: 'var(--apebi-border)' }}
            />
          </div>

          {pwdState.error && (
            <div className="flex items-center gap-2 rounded-lg p-3" style={{ background: 'var(--color-error-muted)', border: '1px solid var(--color-error)' }}>
              <AlertTriangle className="size-4 shrink-0 text-[var(--color-error-text)]" aria-hidden />
              <p className="text-[12px] text-[var(--color-error-text)]">{pwdState.error}</p>
            </div>
          )}
          {pwdState.success && (
            <div className="flex items-center gap-2 rounded-lg p-3" style={{ background: 'var(--color-success-muted)', border: '1px solid var(--color-success)' }}>
              <CheckCircle2 className="size-4 shrink-0 text-[var(--color-success-text)]" aria-hidden />
              <p className="text-[12px] text-[var(--color-success-text)]">Mot de passe modifié avec succès</p>
            </div>
          )}

          <SubmitBtn label="Changer le mot de passe" pendingLabel="Modification…" />
        </form>
      </SectionCard>

      {/* Notification preferences */}
      <SectionCard title="Notifications" icon={Bell}>
        <form action={notifyAction} className="space-y-4">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              name="notify_on_application"
              checked={notifyChecked}
              onChange={(e) => setNotifyChecked(e.target.checked)}
              className="mt-0.5 size-4 rounded accent-[var(--apebi-cyan)]"
            />
            <div>
              <p className="font-heading text-[13px] font-medium text-foreground">
                Recevoir un email à chaque nouvelle candidature
              </p>
              <p className="mt-0.5 text-[12px] text-muted-foreground">
                Un email vous sera envoyé dès qu'un talent postule à l'une de vos offres.
              </p>
            </div>
          </label>

          {notifyState.error && (
            <div className="flex items-center gap-2 rounded-lg p-3" style={{ background: 'var(--color-error-muted)', border: '1px solid var(--color-error)' }}>
              <AlertTriangle className="size-4 shrink-0 text-[var(--color-error-text)]" aria-hidden />
              <p className="text-[12px] text-[var(--color-error-text)]">{notifyState.error}</p>
            </div>
          )}
          {notifyState.success && (
            <div className="flex items-center gap-2 rounded-lg p-3" style={{ background: 'var(--color-success-muted)', border: '1px solid var(--color-success)' }}>
              <CheckCircle2 className="size-4 shrink-0 text-[var(--color-success-text)]" aria-hidden />
              <p className="text-[12px] text-[var(--color-success-text)]">Préférences sauvegardées</p>
            </div>
          )}

          <SubmitBtn label="Sauvegarder" pendingLabel="Sauvegarde…" />
        </form>
      </SectionCard>
    </div>
  )
}
