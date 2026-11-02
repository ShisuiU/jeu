import { memo } from 'react';
import { enemyArtUrl } from './EnemyArt';
import { heroArtUrl } from './HeroArt';

// DÉCORS DE COMBAT — un ciel, une ligne d'horizon et un sol par région du Monde Cousu.
type Region = 'valcrest' | 'sylvaran' | 'prism' | 'akkar' | 'ash' | 'astral' | 'heart';
const PALETTES: Record<Region, { sky: [string, string, string]; ground: [string, string]; accent: string; rift: string; glow: string }> = {
  valcrest: { sky: ['#140b22', '#3a1636', '#1a0d14'], ground: ['#241a26', '#151018'], accent: '#d4a64a', rift: '#b98cff', glow: '#b98cff' },
  sylvaran: { sky: ['#07140c', '#16301c', '#0c1a10'], ground: ['#14241a', '#0a140c'], accent: '#9bbf5a', rift: '#c9f25a', glow: '#9bbf5a' },
  prism: { sky: ['#04121a', '#0d2a3a', '#06141c'], ground: ['#0e1e28', '#060e14'], accent: '#7fe7ff', rift: '#b8f6ff', glow: '#7fe7ff' },
  akkar: { sky: ['#2a0e06', '#6b2a10', '#2a120a'], ground: ['#4a2a14', '#24140a'], accent: '#e3a457', rift: '#ffcc66', glow: '#ff9a3c' },
  ash: { sky: ['#120404', '#3a0a06', '#1a0604'], ground: ['#2a0a06', '#120404'], accent: '#ff6a1f', rift: '#ff6a1f', glow: '#ff4f1f' },
  astral: { sky: ['#06041a', '#1a1040', '#0a0620'], ground: ['#14102a', '#0a0814'], accent: '#c7b6ff', rift: '#efe6ff', glow: '#b07cff' },
  heart: { sky: ['#0a0614', '#2a1440', '#140a20'], ground: ['#1e1428', '#0e0a14'], accent: '#ffcc66', rift: '#ffffff', glow: '#ff9bb5' },
};

function Skyline({ region, p }: { region: Region; p: typeof PALETTES[Region] }) {
  const stroke = { stroke: p.accent, strokeOpacity: 0.35, strokeWidth: 1 };
  switch (region) {
    case 'sylvaran':
      return (<g fill="#06100a" {...stroke}>{Array.from({ length: 9 }, (_, i) => { const x = i * 48 - 10, h = 120 + ((i * 37) % 60); return <path key={i} d={`M${x} 300 L${x + 30} ${300 - h} L${x + 60} 300 Z`} />; })}<path d="M0 300 C80 270 140 290 200 275 C260 262 320 285 390 270 V300 Z" /></g>);
    case 'prism':
      return (<g fill="#081822" {...stroke}>{[[40, 140, 18], [90, 90, 14], [150, 170, 22], [210, 60, 16], [270, 130, 20], [330, 100, 15]].map(([x, top, w], i) => <path key={i} d={`M${x - w} 300 L${x} ${top} L${x + w} 300 Z`} />)}<path d="M0 300 H390 V292 H0 Z" fill={p.accent} fillOpacity="0.2" /></g>);
    case 'akkar':
      return (<g><circle cx="300" cy="120" r="38" fill="#ffcc66" opacity="0.85" /><circle cx="306" cy="116" r="34" fill="#2a0e06" /><path d="M0 300 C60 250 120 240 190 262 C250 280 300 240 390 250 V300 Z" fill="#3a1a0a" {...stroke} /><path d="M120 262 L140 236 L240 236 L260 262 Z M150 236 L160 216 L220 216 L230 236 Z M172 216 L180 202 L200 202 L208 216 Z" fill="#2a160e" {...stroke} /></g>);
    case 'ash':
      return (<g fill="#1a0604" {...stroke}><path d="M0 300 L30 220 L60 260 L100 180 L140 250 L180 200 L220 260 L260 170 L300 240 L340 200 L390 250 V300 Z" /><path d="M0 300 H390" stroke={p.glow} strokeWidth="4" strokeOpacity="0.6" /></g>);
    case 'astral':
      return (<g><circle cx="80" cy="110" r="26" fill="#3a2a6a" opacity="0.8" /><circle cx="320" cy="160" r="12" fill="#c7b6ff" opacity="0.6" /><g fill="#120c2a" {...stroke}><path d="M40 260 L90 250 L110 270 L70 290 Z" /><path d="M250 220 L310 214 L330 232 L280 252 Z" /><path d="M150 280 L200 272 L214 290 L170 300 Z" /></g></g>);
    case 'heart':
      return (<g>{[[195, 120, 40], [120, 200, 24], [270, 190, 28], [60, 250, 16], [330, 250, 18]].map(([x, y, s], i) => <path key={i} d={`M${x} ${y - s * 2} L${x + s} ${y} L${x} ${y + s * 1.2} L${x - s} ${y} Z`} fill={i === 0 ? '#ffe6c0' : '#3a2450'} opacity={i === 0 ? 0.9 : 0.85} stroke={p.glow} strokeOpacity="0.6" />)}</g>);
    default:
      return (<g fill="#120c16" {...stroke}><path d="M0 300 V240 H20 V228 H34 V240 H60 V228 H74 V240 H100 V200 L116 180 L132 200 V240 H170 V228 H184 V240 H220 V228 H234 V240 H262 V190 L280 168 L298 190 V240 H330 V228 H344 V240 H390 V300 Z" /></g>);
  }
}

/** Illustration peinte utilisée comme décor de chaque région (floutée et assombrie). */
const REGION_ART: Record<Region, () => string | undefined> = {
  valcrest: () => enemyArtUrl('herald') ?? heroArtUrl('aldric', 'full'),
  sylvaran: () => enemyArtUrl('mother_tree'),
  prism: () => enemyArtUrl('mother_ai'),
  akkar: () => enemyArtUrl('bronze_colossus'),
  ash: () => enemyArtUrl('ash_lord'),
  astral: () => enemyArtUrl('dead_constellation'),
  heart: () => enemyArtUrl('voice_of_void'),
};

export function PaintedBackdrop({ src, blur = 8, dim = 0.6, position = 'center' }: { src: string; blur?: number; dim?: number; position?: string }) {
  return (
    <div className="painted-bg" aria-hidden>
      <img src={src} alt="" draggable={false} style={{ objectPosition: position, filter: `blur(${blur}px) brightness(${dim}) saturate(1.15)` }} />
      <div className="painted-vignette" />
    </div>
  );
}

export const BattleBackdrop = memo(function BattleBackdrop({ region = 'valcrest' }: { region?: string }) {
  const r = (region in PALETTES ? region : 'valcrest') as Region;
  const art = REGION_ART[r]();
  if (art) return <PaintedBackdrop src={art} />;
  const p = PALETTES[r];
  const id = `bb_${r}`;
  return (
    <svg className="battle-bg" viewBox="0 0 390 844" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>
        <linearGradient id={`${id}_sky`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={p.sky[0]} /><stop offset="0.5" stopColor={p.sky[1]} /><stop offset="1" stopColor={p.sky[2]} /></linearGradient>
        <linearGradient id={`${id}_gr`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={p.ground[0]} /><stop offset="1" stopColor={p.ground[1]} /></linearGradient>
        <filter id={`${id}_blur`}><feGaussianBlur stdDeviation="5" /></filter>
      </defs>
      <rect width="390" height="844" fill={`url(#${id}_sky)`} />
      {(r === 'astral' || r === 'heart' || r === 'valcrest') && <g fill="#fff">{Array.from({ length: 40 }, (_, i) => <circle key={i} cx={(i * 97.3) % 390} cy={(i * 41.7) % 260} r={i % 6 === 0 ? 1.2 : 0.6} opacity={0.3 + (i % 5) / 8} />)}</g>}
      <path d="M-10 120 L80 96 L120 110 L170 70 L210 84 L260 52 L320 72 L400 40" stroke={p.rift} strokeWidth="10" fill="none" opacity="0.4" filter={`url(#${id}_blur)`} />
      <path d="M-10 120 L80 96 L120 110 L170 70 L210 84 L260 52 L320 72 L400 40" stroke={p.rift} strokeWidth="1.6" fill="none" opacity="0.75" />
      <Skyline region={r} p={p} />
      <rect y="300" width="390" height="544" fill={`url(#${id}_gr)`} />
      <g stroke="#ffffff" strokeOpacity="0.04">
        {Array.from({ length: 9 }, (_, i) => <path key={`h${i}`} d={`M0 ${330 + i * i * 7} H390`} />)}
        {Array.from({ length: 11 }, (_, i) => <path key={`v${i}`} d={`M${195 + (i - 5) * 18} 300 L${195 + (i - 5) * 90} 844`} />)}
      </g>
      <ellipse cx="195" cy="430" rx="220" ry="60" fill={p.glow} opacity="0.07" filter={`url(#${id}_blur)`} />
    </svg>
  );
});
