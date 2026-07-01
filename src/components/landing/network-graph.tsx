export function NetworkGraph() {
  return (
    <div className="float-slow relative h-[420px] w-[460px]" aria-hidden>
      <svg viewBox="0 0 460 420" xmlns="http://www.w3.org/2000/svg" className="h-full w-full text-[var(--apebi-cyan)]">
        {/* Connection lines */}
        <g stroke="currentColor" strokeWidth="1">
          <line x1="230" y1="210" x2="100" y2="120" opacity="0.18" />
          <line x1="230" y1="210" x2="360" y2="130" opacity="0.18" />
          <line x1="230" y1="210" x2="375" y2="285" opacity="0.18" />
          <line x1="230" y1="210" x2="115" y2="300" opacity="0.18" />
          <line x1="230" y1="210" x2="230" y2="58" opacity="0.14" />
          <line x1="100" y1="120" x2="55" y2="220" opacity="0.12" />
          <line x1="360" y1="130" x2="420" y2="205" opacity="0.12" />
          <line x1="375" y1="285" x2="305" y2="368" opacity="0.12" />
          <line x1="115" y1="300" x2="55" y2="368" opacity="0.10" />
          <line x1="360" y1="130" x2="230" y2="58" opacity="0.12" />
          <line x1="100" y1="120" x2="230" y2="58" opacity="0.12" />
          <line x1="100" y1="120" x2="115" y2="300" opacity="0.08" strokeDasharray="4 4" />
          <line x1="360" y1="130" x2="375" y2="285" opacity="0.08" strokeDasharray="4 4" />
        </g>

        {/* Peripheral nodes — small dots */}
        <circle cx="55" cy="220" r="20" fill="currentColor" opacity="0.07" />
        <circle cx="55" cy="220" r="13" fill="currentColor" opacity="0.25" />
        <circle cx="55" cy="220" r="7" fill="currentColor" opacity="0.75" className="node-pulse" style={{ animationDelay: '0ms' }} />

        <circle cx="230" cy="58" r="24" fill="currentColor" opacity="0.07" />
        <circle cx="230" cy="58" r="15" fill="currentColor" opacity="0.22" />
        <circle cx="230" cy="58" r="8" fill="currentColor" opacity="0.70" className="node-pulse" style={{ animationDelay: '600ms' }} />

        <circle cx="420" cy="205" r="18" fill="currentColor" opacity="0.08" />
        <circle cx="420" cy="205" r="11" fill="currentColor" opacity="0.28" />
        <circle cx="420" cy="205" r="6" fill="currentColor" opacity="0.72" className="node-pulse" style={{ animationDelay: '1200ms' }} />

        <circle cx="305" cy="368" r="20" fill="currentColor" opacity="0.07" />
        <circle cx="305" cy="368" r="12" fill="currentColor" opacity="0.24" />
        <circle cx="305" cy="368" r="7" fill="currentColor" opacity="0.68" className="node-pulse" style={{ animationDelay: '1800ms' }} />

        <circle cx="55" cy="368" r="16" fill="currentColor" opacity="0.06" />
        <circle cx="55" cy="368" r="10" fill="currentColor" opacity="0.22" />
        <circle cx="55" cy="368" r="6" fill="currentColor" opacity="0.65" className="node-pulse" style={{ animationDelay: '2400ms' }} />

        {/* Mid-tier domain nodes */}
        <circle cx="100" cy="120" r="32" fill="#0a1a26" opacity="0.95" />
        <circle cx="100" cy="120" r="32" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.35" />
        <text x="100" y="116" textAnchor="middle" fill="currentColor" fontSize="8.5" fontWeight="600" fontFamily="Poppins, sans-serif">DEV</text>
        <text x="100" y="127" textAnchor="middle" fill="rgba(255,255,255,0.45)" fontSize="7" fontFamily="Hind, sans-serif">BACKEND</text>

        <circle cx="360" cy="130" r="32" fill="#0a1a26" opacity="0.95" />
        <circle cx="360" cy="130" r="32" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.35" />
        <text x="360" y="126" textAnchor="middle" fill="currentColor" fontSize="8.5" fontWeight="600" fontFamily="Poppins, sans-serif">DATA</text>
        <text x="360" y="137" textAnchor="middle" fill="rgba(255,255,255,0.45)" fontSize="7" fontFamily="Hind, sans-serif">SCIENCE</text>

        <circle cx="375" cy="285" r="32" fill="#0a1a26" opacity="0.95" />
        <circle cx="375" cy="285" r="32" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.35" />
        <text x="375" y="281" textAnchor="middle" fill="currentColor" fontSize="8.5" fontWeight="600" fontFamily="Poppins, sans-serif">CYBER</text>
        <text x="375" y="292" textAnchor="middle" fill="rgba(255,255,255,0.45)" fontSize="7" fontFamily="Hind, sans-serif">SECURITY</text>

        <circle cx="115" cy="300" r="32" fill="#0a1a26" opacity="0.95" />
        <circle cx="115" cy="300" r="32" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.35" />
        <text x="115" y="296" textAnchor="middle" fill="currentColor" fontSize="8.5" fontWeight="600" fontFamily="Poppins, sans-serif">CLOUD</text>
        <text x="115" y="307" textAnchor="middle" fill="rgba(255,255,255,0.45)" fontSize="7" fontFamily="Hind, sans-serif">INFRA</text>

        {/* Central node — APEBI TechTalent hub */}
        <circle cx="230" cy="210" r="60" fill="currentColor" opacity="0.04" />
        <circle cx="230" cy="210" r="48" fill="currentColor" opacity="0.06" />
        <circle cx="230" cy="210" r="36" fill="#0a1f2e" opacity="0.98" />
        <circle cx="230" cy="210" r="36" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.60" />
        <text x="230" y="205" textAnchor="middle" fill="rgba(255,255,255,0.70)" fontSize="8" fontFamily="Poppins, sans-serif" fontWeight="400">APEBI</text>
        <text x="230" y="218" textAnchor="middle" fill="currentColor" fontSize="9" fontWeight="700" fontFamily="Poppins, sans-serif">TechTalent</text>
      </svg>

      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute inset-0 rounded-full"
        style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(0,175,210,0.05) 0%, transparent 70%)' }}
      />
    </div>
  )
}
