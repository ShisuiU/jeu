import { memo } from 'react';

// Décor de combat : les remparts du Mur Blanc sous le ciel fracturé (chapitre 1).
// D'autres régions pourront être ajoutées par la clé `region`.
const PALETTES: Record<string, { sky: [string, string, string]; ground: string; accent: string }> = {
  valcrest: { sky: ['#140b22', '#3a1636', '#1a0d14'], ground: '#151018', accent: '#d4a64a' },
};

export const BattleBackdrop = memo(function BattleBackdrop({ region = 'valcrest' }: { region?: string }) {
  const p = PALETTES[region] ?? PALETTES.valcrest;
  return (
    <svg className="battle-bg" viewBox="0 0 390 844" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>
        <linearGradient id="bsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={p.sky[0]} /><stop offset="0.5" stopColor={p.sky[1]} /><stop offset="1" stopColor={p.sky[2]} /></linearGradient>
        <linearGradient id="bground" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#241a26" /><stop offset="1" stopColor={p.ground} /></linearGradient>
        <filter id="bblur"><feGaussianBlur stdDeviation="5" /></filter>
      </defs>
      <rect width="390" height="844" fill="url(#bsky)" />
      <path d="M-10 120 L80 96 L120 110 L170 70 L210 84 L260 52 L320 72 L400 40" stroke="#b98cff" strokeWidth="10" fill="none" opacity="0.45" filter="url(#bblur)" />
      <path d="M-10 120 L80 96 L120 110 L170 70 L210 84 L260 52 L320 72 L400 40" stroke="#efe2ff" strokeWidth="2" fill="none" opacity="0.8" />
      {/* remparts au loin */}
      <g fill="#120c16" stroke={p.accent} strokeOpacity="0.35" strokeWidth="1">
        <path d="M0 300 V240 H20 V228 H34 V240 H60 V228 H74 V240 H100 V200 L116 180 L132 200 V240 H170 V228 H184 V240 H220 V228 H234 V240 H262 V190 L280 168 L298 190 V240 H330 V228 H344 V240 H390 V300 Z" />
      </g>
      <rect y="300" width="390" height="544" fill="url(#bground)" />
      {/* dalles en perspective */}
      <g stroke="#ffffff" strokeOpacity="0.04">
        {Array.from({ length: 9 }, (_, i) => <path key={`h${i}`} d={`M0 ${330 + i * i * 7} H390`} />)}
        {Array.from({ length: 11 }, (_, i) => <path key={`v${i}`} d={`M${195 + (i - 5) * 18} 300 L${195 + (i - 5) * 90} 844`} />)}
      </g>
      <ellipse cx="195" cy="430" rx="220" ry="60" fill="#b98cff" opacity="0.06" filter="url(#bblur)" />
      <rect width="390" height="844" fill="url(#vign)" opacity="0" />
    </svg>
  );
});
