import type { CSSProperties } from 'react'

const HUB = { x: 230, y: 210 }

// Nœuds-domaines reliés au hub APEBI — chaque lien porte des « signaux » qui circulent
// dans les deux sens (fédération qui connecte + membres qui échangent).
const SPOKES = [
  { x: 100, y: 120, r: 32, t: 'DEV', s: 'BACKEND', delay: 0 },
  { x: 360, y: 130, r: 32, t: 'DATA', s: 'SCIENCE', delay: 0.5 },
  { x: 375, y: 285, r: 32, t: 'CYBER', s: 'SECURITY', delay: 1.0 },
  { x: 115, y: 300, r: 32, t: 'CLOUD', s: 'INFRA', delay: 1.5 },
  { x: 230, y: 58, r: 22, t: null, s: null, delay: 2.0 },
] as const

// Petits nœuds périphériques (ambiance) reliés aux domaines
const SATELLITES = [
  { from: { x: 100, y: 120 }, x: 55, y: 220, r: 7, delay: 0.3 },
  { from: { x: 360, y: 130 }, x: 420, y: 205, r: 6, delay: 0.9 },
  { from: { x: 375, y: 285 }, x: 305, y: 368, r: 7, delay: 1.4 },
  { from: { x: 115, y: 300 }, x: 55, y: 368, r: 6, delay: 1.9 },
] as const

type SignalStyle = CSSProperties & { '--dx': string; '--dy': string }

function signalStyle(from: { x: number; y: number }, to: { x: number; y: number }, delay: number, duration: number): SignalStyle {
  return {
    '--dx': `${to.x - from.x}px`,
    '--dy': `${to.y - from.y}px`,
    animationDelay: `${delay}s`,
    animationDuration: `${duration}s`,
  }
}

/** Signal lumineux (halo + cœur) qui voyage de `from` vers `to` le long d'un lien. */
function Signal({ from, to, delay, duration }: { from: { x: number; y: number }; to: { x: number; y: number }; delay: number; duration: number }) {
  return (
    <g className="signal" style={signalStyle(from, to, delay, duration)}>
      <circle cx={from.x} cy={from.y} r="5" fill="var(--apebi-cyan)" opacity="0.22" />
      <circle cx={from.x} cy={from.y} r="2.3" fill="#7DEBFF" />
    </g>
  )
}

export function NetworkGraph() {
  return (
    <div className="float-slow relative h-[420px] w-[460px]" aria-hidden>
      <svg viewBox="0 0 460 420" xmlns="http://www.w3.org/2000/svg" className="h-full w-full text-[var(--apebi-cyan)]">
        {/* ── Liens hub ↔ domaines : flux animé (tirets qui défilent) ── */}
        <g stroke="currentColor" fill="none">
          {SPOKES.map((n) => (
            <line
              key={`spoke-${n.t ?? 'top'}`}
              className="line-stream"
              x1={HUB.x}
              y1={HUB.y}
              x2={n.x}
              y2={n.y}
              strokeWidth="1"
              opacity="0.28"
            />
          ))}
          {/* Liens domaines ↔ satellites + maillage inter-domaines (statiques, discrets) */}
          {SATELLITES.map((sat) => (
            <line key={`sat-${sat.x}-${sat.y}`} x1={sat.from.x} y1={sat.from.y} x2={sat.x} y2={sat.y} strokeWidth="1" opacity="0.12" />
          ))}
          <line x1="360" y1="130" x2="230" y2="58" strokeWidth="1" opacity="0.12" />
          <line x1="100" y1="120" x2="230" y2="58" strokeWidth="1" opacity="0.12" />
          <line x1="100" y1="120" x2="115" y2="300" strokeWidth="1" opacity="0.08" strokeDasharray="4 5" />
          <line x1="360" y1="130" x2="375" y2="285" strokeWidth="1" opacity="0.08" strokeDasharray="4 5" />
        </g>

        {/* ── Signaux qui circulent : hub → domaine (sortant) et domaine → hub (entrant) ── */}
        {SPOKES.map((n) => (
          <Signal key={`out-${n.t ?? 'top'}`} from={HUB} to={n} delay={n.delay} duration={2.8} />
        ))}
        {SPOKES.map((n) => (
          <Signal key={`in-${n.t ?? 'top'}`} from={n} to={HUB} delay={n.delay + 1.4} duration={2.8} />
        ))}
        {SATELLITES.map((sat) => (
          <Signal key={`satsig-${sat.x}-${sat.y}`} from={sat.from} to={sat} delay={sat.delay} duration={2.4} />
        ))}

        {/* ── Satellites (petits nœuds vivants) ── */}
        {SATELLITES.map((sat, i) => (
          <g key={`satnode-${sat.x}-${sat.y}`} className={`node-drift-${(['a', 'b', 'c', 'd'] as const)[i % 4]}`}>
            <circle cx={sat.x} cy={sat.y} r={sat.r + 12} fill="currentColor" opacity="0.06" />
            <circle cx={sat.x} cy={sat.y} r={sat.r + 5} fill="currentColor" opacity="0.22" />
            <circle cx={sat.x} cy={sat.y} r={sat.r} fill="currentColor" opacity="0.72" className="node-pulse" style={{ animationDelay: `${sat.delay}s` }} />
          </g>
        ))}

        {/* ── Nœuds-domaines (cellules) : halo qui respire + libellé ── */}
        {SPOKES.map((n, i) => (
          <g key={`node-${n.t ?? 'top'}`} className={`node-drift-${(['b', 'c', 'a', 'd', 'b'] as const)[i]}`}>
            {/* halo qui respire */}
            <circle className="node-breathe" cx={n.x} cy={n.y} r={n.r} fill="none" stroke="currentColor" strokeWidth="1" opacity="0.5" style={{ animationDelay: `${n.delay * 0.4}s` }} />
            <circle cx={n.x} cy={n.y} r={n.r} fill="var(--apebi-dark-90)" opacity="0.95" />
            <circle cx={n.x} cy={n.y} r={n.r} fill="none" stroke="currentColor" strokeWidth="1" opacity="0.35" />
            {n.t ? (
              <>
                <text x={n.x} y={n.y - 4} textAnchor="middle" fill="currentColor" fontSize="8.5" fontWeight="600" fontFamily="Poppins, sans-serif">{n.t}</text>
                <text x={n.x} y={n.y + 7} textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="7" fontFamily="Hind, sans-serif">{n.s}</text>
              </>
            ) : (
              <circle cx={n.x} cy={n.y} r="8" fill="currentColor" opacity="0.7" className="node-pulse" style={{ animationDelay: '0.6s' }} />
            )}
          </g>
        ))}

        {/* ── Cœur APEBI : anneaux qui rayonnent (la fédération émet) ── */}
        <g>
          <circle className="hub-ring" cx={HUB.x} cy={HUB.y} r="36" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <circle className="hub-ring" cx={HUB.x} cy={HUB.y} r="36" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ animationDelay: '1.4s' }} />
          <circle className="hub-ring" cx={HUB.x} cy={HUB.y} r="36" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ animationDelay: '2.8s' }} />
        </g>

        {/* Central node — APEBI TechTalent hub */}
        <circle cx={HUB.x} cy={HUB.y} r="60" fill="currentColor" opacity="0.05" />
        <circle cx={HUB.x} cy={HUB.y} r="48" fill="currentColor" opacity="0.07" />
        <circle cx={HUB.x} cy={HUB.y} r="36" fill="var(--apebi-dark-90)" opacity="0.98" />
        <circle className="hub-core" cx={HUB.x} cy={HUB.y} r="36" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
        <text x={HUB.x} y={HUB.y - 5} textAnchor="middle" fill="rgba(255,255,255,0.55)" fontSize="8" fontFamily="Poppins, sans-serif" fontWeight="400">APEBI</text>
        <text x={HUB.x} y={HUB.y + 8} textAnchor="middle" fill="currentColor" fontSize="9" fontWeight="700" fontFamily="Poppins, sans-serif">TechTalent</text>
      </svg>

      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute inset-0 rounded-full"
        style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(0,175,210,0.08) 0%, transparent 70%)' }}
      />
    </div>
  )
}
