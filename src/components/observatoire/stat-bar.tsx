// Barre horizontale server-rendered (aucun JS client, aucune dépendance).
// Utilisée par l'Observatoire pour classer compétences / villes.

type StatBarProps = {
  label: string
  value: number
  max: number
  /** Légende secondaire optionnelle (ex: code domaine) */
  hint?: string
  /** Couleur de la barre (classe Tailwind bg-*) */
  barClass?: string
}

export function StatBar({ label, value, max, hint, barClass = 'bg-[#00AFD2]' }: StatBarProps) {
  // Largeur min 2% pour rester visible même à faible valeur
  const pct = max > 0 ? Math.max(2, Math.round((value / max) * 100)) : 0

  return (
    <div className="flex items-center gap-3">
      <div className="w-40 shrink-0 truncate text-right text-xs text-white/70" title={label}>
        {label}
        {hint && <span className="ml-1.5 text-white/30">{hint}</span>}
      </div>
      <div className="h-5 flex-1 overflow-hidden rounded-md bg-white/5">
        <div
          className={`flex h-full items-center justify-end rounded-md ${barClass} px-2`}
          style={{ width: `${pct}%` }}
        >
          <span className="text-[11px] font-semibold text-[#0F0F0F]">{value}</span>
        </div>
      </div>
    </div>
  )
}
