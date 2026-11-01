import { memo } from 'react';
import { ENEMIES, type EnemyDef } from '../../data/enemies';

// Silhouettes provisoires des Effacés : formes grises sans visage, fissurées de lumière violette.
// Les illustrations définitives se déposent dans src/assets/enemies/<id>/portrait.webp.
const files = import.meta.glob('/src/assets/enemies/*/*.{webp,png,jpg,jpeg}', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const ART: Record<string, string> = {};
for (const [p, url] of Object.entries(files)) { const m = p.match(/enemies\/([^/]+)\/portrait\./); if (m) ART[m[1]] = url; }

const SHAPES: Record<EnemyDef['shape'], (c: string) => JSX.Element> = {
  soldier: (c) => (<g><path d="M150 70 C180 70 196 96 194 128 L190 170 H110 L106 128 C104 96 120 70 150 70 Z" fill="#2c2a31" stroke={c} strokeWidth="2" /><path d="M118 128 H182" stroke={c} strokeWidth="3" opacity="0.7" /><path d="M236 120 L250 126 L170 330 L156 324 Z" fill="#3a3a42" stroke={c} strokeWidth="1.5" /></g>),
  archer: (c) => (<g><path d="M100 160 C96 80 124 56 150 56 C176 56 204 80 200 160 C190 130 176 116 150 114 C124 116 110 130 100 160 Z" fill="#1d1b22" stroke={c} strokeWidth="2" /><path d="M250 80 C290 180 290 260 250 360" stroke={c} strokeWidth="5" fill="none" /><path d="M250 80 L250 360" stroke={c} strokeWidth="1.2" opacity="0.9" /></g>),
  shield: (c) => (<g><path d="M30 190 L130 170 L136 320 C130 360 90 388 60 396 C36 370 24 330 26 290 Z" fill="#3b352f" stroke={c} strokeWidth="3" /><path d="M64 200 L90 260 L70 330" stroke={c} strokeWidth="3" fill="none" opacity="0.9" /></g>),
  cantor: (c) => (<g><path d="M120 76 L150 40 L180 76 Z" fill="#2a2433" stroke={c} strokeWidth="2" /><path d="M134 150 H166" stroke={c} strokeWidth="2" strokeDasharray="3 3" /><circle cx="150" cy="118" r="90" fill="none" stroke={c} strokeWidth="1.2" opacity="0.4" /></g>),
  hound: (c) => (<g><path d="M40 300 C60 230 120 210 170 214 L210 170 L232 176 L226 206 C262 220 270 260 262 300 L250 380 H226 L222 320 L120 320 L104 380 H80 L84 316 Z" fill="#1c1a22" stroke={c} strokeWidth="2.5" /><circle cx="222" cy="194" r="4" fill={c} /></g>),
  knight: (c) => (<g><path d="M150 60 C186 60 200 92 198 130 L196 176 H104 L102 130 C100 92 114 60 150 60 Z" fill="#3c3f48" stroke={c} strokeWidth="2.5" /><path d="M126 112 H174 M150 112 V150" stroke={c} strokeWidth="4" /><path d="M64 120 L76 116 L104 380 L92 384 Z" fill="#4b4f59" stroke={c} strokeWidth="1.5" /></g>),
  herald: (c) => (<g><circle cx="150" cy="104" r="78" fill="none" stroke={c} strokeWidth="2" strokeDasharray="10 6" opacity="0.8" /><path d="M110 50 L120 26 L136 46 L150 18 L164 46 L180 26 L190 50" stroke={c} strokeWidth="3" fill="none" /><path d="M222 200 C222 170 262 170 262 200 L270 250 H214 Z" fill="#6b5330" stroke="#e3b06a" strokeWidth="2" /><circle cx="242" cy="258" r="6" fill="#e3b06a" /></g>),
};

function Procedural({ def }: { def: EnemyDef }) {
  const [p0, p1] = def.palette;
  const g = `en_${def.id}`;
  const humanoid = def.shape !== 'hound';
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
