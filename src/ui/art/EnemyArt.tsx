import { memo } from 'react';
import { ENEMIES, type EnemyDef } from '../../data/enemies';

// Silhouettes provisoires des Effacés : formes grises sans visage, fissurées de lumière violette.
// Les illustrations définitives se déposent dans src/assets/enemies/<id>/portrait.webp.
const files = import.meta.glob('/src/assets/enemies/*/portrait.{webp,png,jpg,jpeg}', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const ART: Record<string, string> = {};
for (const [p, url] of Object.entries(files)) { const m = p.match(/enemies\/([^/]+)\/portrait\./); if (m) ART[m[1]] = url; }

const SHAPES: Record<EnemyDef['shape'], (c: string) => JSX.Element> = {
  soldier: (c) => (<g><path d="M150 70 C180 70 196 96 194 128 L190 170 H110 L106 128 C104 96 120 70 150 70 Z" fill="#2c2a31" stroke={c} strokeWidth="2" /><path d="M118 128 H182" stroke={c} strokeWidth="3" opacity="0.7" /><path d="M236 120 L250 126 L170 330 L156 324 Z" fill="#3a3a42" stroke={c} strokeWidth="1.5" /></g>),
  archer: (c) => (<g><path d="M100 160 C96 80 124 56 150 56 C176 56 204 80 200 160 C190 130 176 116 150 114 C124 116 110 130 100 160 Z" fill="#1d1b22" stroke={c} strokeWidth="2" /><path d="M250 80 C290 180 290 260 250 360" stroke={c} strokeWidth="5" fill="none" /><path d="M250 80 L250 360" stroke={c} strokeWidth="1.2" opacity="0.9" /></g>),
  shield: (c) => (<g><path d="M30 190 L130 170 L136 320 C130 360 90 388 60 396 C36 370 24 330 26 290 Z" fill="#3b352f" stroke={c} strokeWidth="3" /><path d="M64 200 L90 260 L70 330" stroke={c} strokeWidth="3" fill="none" opacity="0.9" /></g>),
  cantor: (c) => (<g><path d="M120 76 L150 40 L180 76 Z" fill="#2a2433" stroke={c} strokeWidth="2" /><path d="M134 150 H166" stroke={c} strokeWidth="2" strokeDasharray="3 3" /><circle cx="150" cy="118" r="90" fill="none" stroke={c} strokeWidth="1.2" opacity="0.4" /></g>),
  hound: (c) => (<g><path d="M40 300 C60 230 120 210 170 214 L210 170 L232 176 L226 206 C262 220 270 260 262 300 L250 380 H226 L222 320 L120 320 L104 380 H80 L84 316 Z" fill="#1c1a22" stroke={c} strokeWidth="2.5" /><circle cx="222" cy="194" r="4" fill={c} /></g>),
  knight: (c) => (<g><path d="M150 60 C186 60 200 92 198 130 L196 176 H104 L102 130 C100 92 114 60 150 60 Z" fill="#3c3f48" stroke={c} strokeWidth="2.5" /><path d="M126 112 H174 M150 112 V150" stroke={c} strokeWidth="4" /><path d="M64 120 L76 116 L104 380 L92 384 Z" fill="#4b4f59" stroke={c} strokeWidth="1.5" /></g>),
  golem: (c) => (<g><rect x="70" y="200" width="160" height="200" rx="20" fill="#3a2a1a" stroke={c} strokeWidth="3" /><circle cx="150" cy="270" r="22" fill={c} opacity="0.9" /><rect x="20" y="230" width="50" height="40" rx="6" fill="#4a3a2a" stroke={c} strokeWidth="2" /><rect x="230" y="230" width="50" height="40" rx="6" fill="#4a3a2a" stroke={c} strokeWidth="2" /></g>),
  wyrm: (c) => (<g><path d="M60 380 C40 300 90 240 150 230 C220 220 260 160 240 100 L270 120 L250 60 C300 120 290 220 220 270 C180 300 120 300 100 380 Z" fill="#3a2a10" stroke={c} strokeWidth="2.5" /><path d="M40 160 L120 210 L60 240 Z M260 260 L200 240 L250 300 Z" fill={c} opacity="0.5" /><circle cx="252" cy="96" r="5" fill={c} /></g>),
  alchemist: (c) => (<g><path d="M110 76 L190 76 L176 50 L124 50 Z" fill="#203a4a" stroke={c} strokeWidth="2" /><path d="M60 300 l12 -30 h16 l12 30 z M200 320 l10 -26 h14 l10 26 z" fill={c} opacity="0.85" /><circle cx="150" cy="118" r="88" fill="none" stroke={c} strokeWidth="1" strokeDasharray="2 6" /></g>),
  archivist: (c) => (<g>{[0, 1, 2, 3, 4].map((i) => <rect key={i} x={40 + i * 50} y={40 + (i % 2) * 40} width="34" height="44" fill="#f0eadc" opacity="0.25" stroke={c} transform={`rotate(${i * 17 - 30} ${57 + i * 50} ${62 + (i % 2) * 40})`} />)}</g>),
  sentinel: (c) => (<g><path d="M150 40 L196 96 L180 180 H120 L104 96 Z" fill="#1d1d2a" stroke={c} strokeWidth="2.5" /><path d="M150 40 L150 180 M104 96 H196" stroke={c} strokeWidth="1.2" opacity="0.7" /><path d="M250 90 L262 96 L200 380 L188 376 Z" fill="#2a2a3a" stroke={c} strokeWidth="1.5" /></g>),
  colossus: (c) => (<g><path d="M80 30 H220 L236 120 L64 120 Z" fill="#4a3018" stroke={c} strokeWidth="3" /><circle cx="150" cy="84" r="20" fill="#000" stroke={c} strokeWidth="3" /><circle cx="150" cy="84" r="8" fill={c} /><path d="M120 150 L140 230 L118 300 M190 160 L170 240" stroke={c} strokeWidth="3" fill="none" /></g>),
  tree: (c) => (<g><path d="M130 400 L140 230 C80 230 40 170 70 120 C60 70 120 40 150 60 C180 30 250 60 240 120 C270 170 230 230 160 230 L170 400 Z" fill="#1a2410" stroke={c} strokeWidth="3" /><ellipse cx="150" cy="300" rx="14" ry="34" fill="#b98cff" opacity="0.8" /><path d="M140 300 L100 400 M160 300 L210 400 M150 330 L150 400" stroke={c} strokeWidth="3" /></g>),
  void: (c) => (<g>{[[150, 60], [90, 120], [210, 120], [70, 220], [230, 220], [120, 300], [180, 300]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={i === 0 ? 14 : 9} fill={c} opacity="0.9" />)}<path d="M150 60 L90 120 L70 220 L120 300 L180 300 L230 220 L210 120 Z" fill="none" stroke={c} strokeWidth="1.5" opacity="0.6" /><circle cx="150" cy="180" r="40" fill="#000" stroke={c} strokeWidth="2" /></g>),
  herald: (c) => (<g><circle cx="150" cy="104" r="78" fill="none" stroke={c} strokeWidth="2" strokeDasharray="10 6" opacity="0.8" /><path d="M110 50 L120 26 L136 46 L150 18 L164 46 L180 26 L190 50" stroke={c} strokeWidth="3" fill="none" /><path d="M222 200 C222 170 262 170 262 200 L270 250 H214 Z" fill="#6b5330" stroke="#e3b06a" strokeWidth="2" /><circle cx="242" cy="258" r="6" fill="#e3b06a" /></g>),
};

function Procedural({ def }: { def: EnemyDef }) {
  const [p0, p1] = def.palette;
  const g = `en_${def.id}`;
  const humanoid = !['hound', 'tree', 'void', 'wyrm'].includes(def.shape);
  return (
    <svg viewBox="0 0 300 400" preserveAspectRatio="xMidYMid slice" width="100%" height="100%" style={{ display: 'block' }}>
      <defs>
        <radialGradient id={`${g}_bg`} cx="50%" cy="35%" r="80%"><stop offset="0" stopColor={p1} stopOpacity="0.45" /><stop offset="0.45" stopColor="#1a1222" /><stop offset="1" stopColor="#050408" /></radialGradient>
        <linearGradient id={`${g}_b`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={p0} /><stop offset="1" stopColor="#0a090d" /></linearGradient>
      </defs>
      <rect width="300" height="400" fill={`url(#${g}_bg)`} />
      {humanoid && (
        <g>
          <path d="M150 66 C182 66 196 94 194 124 C192 152 178 174 150 178 C122 174 108 152 106 124 C104 94 118 66 150 66 Z" fill={`url(#${g}_b)`} stroke={p1} strokeWidth="2" />
          <path d="M130 172 L128 202 C90 208 50 226 30 264 L14 400 H286 L270 264 C250 226 210 208 172 202 L170 172 Z" fill={`url(#${g}_b)`} stroke={p1} strokeWidth="2" />
          <path d="M140 90 L152 120 L144 140 M160 220 L170 260 L160 300" stroke={p1} strokeWidth="2" fill="none" opacity="0.9" />
        </g>
      )}
      {SHAPES[def.shape](p1)}
      {def.boss && <rect width="300" height="400" fill="none" stroke="#ff3d6e" strokeWidth="5" opacity="0.7" />}
    </svg>
  );
}

export const EnemyArt = memo(function EnemyArt({ enemyId }: { enemyId: string }) {
  const def = ENEMIES[enemyId];
  if (!def) return null;
  if (ART[enemyId]) return <img src={ART[enemyId]} alt={def.name} draggable={false} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />;
  return <Procedural def={def} />;
});
