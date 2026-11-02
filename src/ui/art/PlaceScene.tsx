import { memo } from 'react';

// LIEUX DU JEU — Sanctuaire (héros) et Forge (équipement).
// Une illustration peut être déposée dans src/assets/places/<id>.webp : elle remplace
// automatiquement la scène vectorielle ci-dessous.
const files = import.meta.glob('/src/assets/places/*.{webp,png,jpg,jpeg}', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const PLACE_ART: Record<string, string> = {};
for (const [path, url] of Object.entries(files)) {
  const m = path.match(/places\/([^/.]+)\./);
  if (m) PLACE_ART[m[1]] = url;
}

export type PlaceId = 'sanctuary' | 'forge';

/** Illustration d'un lieu (sanctuary, forge, altar…), si elle existe. */
export function placeArt(id: string): string | undefined { return PLACE_ART[id]; }

const FOCUS: Record<PlaceId, string> = { sanctuary: '50% 55%', forge: '55% 62%' };

export const PlaceScene = memo(function PlaceScene({ place }: { place: PlaceId }) {
  const art = PLACE_ART[place];
  if (art) return <img className="place-img" src={art} alt="" draggable={false} style={{ objectPosition: FOCUS[place] }} />;
  return place === 'forge' ? <ForgeSvg /> : <SanctuarySvg />;
});

function SanctuarySvg() {
  return (
    <svg className="place-img" viewBox="0 0 400 260" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>
        <linearGradient id="sa-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#0d0a1c" /><stop offset="1" stopColor="#1d1530" /></linearGradient>
        <radialGradient id="sa-glow" cx="50%" cy="62%" r="45%"><stop offset="0" stopColor="#f6dc9a" stopOpacity="0.75" /><stop offset="0.45" stopColor="#b98cff" stopOpacity="0.25" /><stop offset="1" stopColor="#000" stopOpacity="0" /></radialGradient>
        <linearGradient id="sa-beam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff2c8" stopOpacity="0.55" /><stop offset="1" stopColor="#fff2c8" stopOpacity="0" /></linearGradient>
        <linearGradient id="sa-stone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2a2438" /><stop offset="1" stopColor="#0c0a12" /></linearGradient>
      </defs>
      <rect width="400" height="260" fill="url(#sa-sky)" />
      {/* Grande arche du fond */}
      <path d="M110 260 V110 Q200 10 290 110 V260" fill="#120e1d" stroke="#3a3150" strokeWidth="3" />
      <path d="M130 260 V118 Q200 36 270 118 V260" fill="#17122a" />
      {/* Rosace */}
      <g transform="translate(200 92)" opacity="0.9">
        <circle r="30" fill="#251c3a" stroke="#d9b36a" strokeOpacity="0.6" strokeWidth="2" />
        {Array.from({ length: 8 }, (_, i) => <path key={i} d="M0 0 L0 -27" stroke="#d9b36a" strokeOpacity="0.45" strokeWidth="2" transform={`rotate(${i * 45})`} />)}
        <circle r="9" fill="#f6dc9a" opacity="0.8" />
      </g>
      {/* Rayon de lumière */}
      <path d="M182 100 L218 100 L262 260 L138 260 Z" fill="url(#sa-beam)" />
      <rect width="400" height="260" fill="url(#sa-glow)" />
      {/* Colonnes */}
      {[40, 340].map((x) => (
        <g key={x}>
          <rect x={x - 18} y="40" width="36" height="220" fill="url(#sa-stone)" />
          <rect x={x - 24} y="34" width="48" height="12" fill="#2f2840" />
          <path d={`M${x - 10} 46 V260 M${x} 46 V260 M${x + 10} 46 V260`} stroke="#000" strokeOpacity="0.35" />
        </g>
      ))}
      {/* Autel */}
      <path d="M150 224 H250 L242 206 H158 Z" fill="#2d2540" stroke="#d9b36a" strokeOpacity="0.5" />
      <rect x="166" y="224" width="68" height="36" fill="#1b1628" />
      <ellipse cx="200" cy="200" rx="22" ry="5" fill="#f6dc9a" opacity="0.6" />
      {/* Runes flottantes */}
      {[[150, 150], [252, 140], [176, 120], [232, 176], [204, 160]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i % 2 ? 2.4 : 1.6} fill="#f6dc9a" opacity="0.8" />
      ))}
      <rect y="232" width="400" height="28" fill="#07060b" opacity="0.6" />
    </svg>
  );
}

function ForgeSvg() {
  return (
    <svg className="place-img" viewBox="0 0 400 260" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>
        <linearGradient id="fo-bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#120a08" /><stop offset="1" stopColor="#2a130a" /></linearGradient>
        <radialGradient id="fo-fire" cx="50%" cy="58%" r="42%"><stop offset="0" stopColor="#ffd27a" stopOpacity="0.95" /><stop offset="0.35" stopColor="#ff7a2a" stopOpacity="0.55" /><stop offset="1" stopColor="#000" stopOpacity="0" /></radialGradient>
        <linearGradient id="fo-metal" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#4a3a32" /><stop offset="1" stopColor="#140c09" /></linearGradient>
      </defs>
      <rect width="400" height="260" fill="url(#fo-bg)" />
      {/* Voûte de pierre */}
      <path d="M0 0 H400 V70 Q200 -10 0 70 Z" fill="#0a0605" />
      {Array.from({ length: 9 }, (_, i) => <path key={i} d={`M${i * 50} ${40 - Math.abs(4 - i) * 6} l40 -6`} stroke="#3a2418" strokeWidth="2" />)}
      {/* Foyer */}
      <path d="M140 200 V120 Q200 70 260 120 V200 Z" fill="#1a0d08" stroke="#5a3420" strokeWidth="4" />
      <path d="M156 200 V128 Q200 92 244 128 V200 Z" fill="#ff8a33" opacity="0.85" />
      <path d="M170 200 Q178 160 190 176 Q196 140 204 168 Q214 132 222 172 Q232 158 232 200 Z" fill="#ffd27a" />
      <rect width="400" height="260" fill="url(#fo-fire)" />
      {/* Chaînes et outils suspendus */}
      {[60, 92, 316, 348].map((x, i) => (
        <g key={x} stroke="#5a463c" strokeWidth="2">
          <path d={`M${x} 30 V${90 + (i % 2) * 20}`} strokeDasharray="4 3" />
          {i % 2 ? <path d={`M${x - 8} ${112} h16 v10 h-16 z`} fill="#2b1e18" /> : <path d={`M${x} 90 l-10 16 h20 z`} fill="#2b1e18" />}
        </g>
      ))}
      {/* Enclume */}
      <path d="M150 236 h100 l-8 -12 h-22 v-16 h40 q-10 -12 -40 -12 h-60 q-20 0 -26 12 h24 v16 h-22 z" fill="url(#fo-metal)" stroke="#ffb35a" strokeOpacity="0.4" />
      <rect x="182" y="236" width="36" height="24" fill="#120a07" />
      {/* Étincelles */}
      {[[176, 150], [214, 140], [196, 118], [238, 128], [160, 132], [226, 100], [186, 96]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i % 3 ? 1.6 : 2.4} fill="#ffd27a" opacity="0.9" />
      ))}
      <rect y="236" width="400" height="24" fill="#07060b" opacity="0.6" />
    </svg>
  );
}

/** Fond d'écran d'un lieu : l'illustration floutée et assombrie derrière tout l'écran. */
export function PlaceAmbient({ place }: { place: PlaceId }) {
  const art = PLACE_ART[place];
  if (!art) return <div className="bg-ambient" />;
  return (
    <div className="place-ambient" aria-hidden>
      <img src={art} alt="" draggable={false} />
    </div>
  );
}
