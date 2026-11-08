import { memo } from 'react';
import { HERO_BY_ID } from '../../data/heroes';
import { FACTIONS } from '../../data/factions';
import { RARITIES } from '../../data/rarities';
import type { HeroDef, RoleId } from '../../data/types';
import { FactionEmblem } from './FactionEmblem';

// PIPELINE D'ILLUSTRATIONS
// Déposer les images dans src/assets/heroes/<idDuHéros>/portrait.webp (et full.webp, battle.webp).
// Elles sont détectées automatiquement à la compilation, optimisées et mises en cache hors ligne.
// Tant qu'une illustration manque, un portrait vectoriel provisoire (silhouette + emblème) est affiché.
const files = import.meta.glob('/src/assets/heroes/*/*.{webp,png,jpg,jpeg}', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
type Kind = 'portrait' | 'full' | 'battle';
const ART: Record<string, Partial<Record<Kind, string>>> = {};
for (const [path, url] of Object.entries(files)) {
  const m = path.match(/heroes\/([^/]+)\/(portrait|full|battle)\./);
  if (m) (ART[m[1]] ??= {})[m[2] as Kind] = url;
}

export function heroArtUrl(id: string, kind: Kind): string | undefined {
  const a = ART[id];
  if (!a) return undefined;
  return a[kind] ?? (kind === 'portrait' ? a.full : a.portrait) ?? a.battle;
}

// ─── Portrait vectoriel provisoire ───
const ROLE_PROPS: Record<RoleId, (c: string) => JSX.Element> = {
  defender: (c) => (
    <g>
      <path d="M18 210 L92 190 L100 300 C96 350 70 380 40 392 C20 370 10 330 12 290 Z" fill="url(#metal)" stroke={c} strokeWidth="2.5" />
      <path d="M56 222 V360 M28 280 H92" stroke={c} strokeWidth="3" opacity="0.6" />
      <path d="M82 248 C90 220 120 212 140 226 L132 262 Z M218 248 C210 220 180 212 160 226 L168 262 Z" fill="url(#metal)" stroke={c} strokeWidth="2" />
    </g>
  ),
  attacker: (c) => (
    <g>
      <path d="M248 18 L262 26 L118 330 L104 322 Z" fill="url(#metal)" stroke={c} strokeWidth="2" />
      <path d="M96 300 L140 324" stroke={c} strokeWidth="9" strokeLinecap="round" />
      <path d="M255 22 L262 26 L200 160" stroke="#fff" strokeOpacity="0.6" strokeWidth="1.5" />
    </g>
  ),
  healer: (c) => (
    <g>
      <path d="M236 80 L248 82 L232 400 L220 400 Z" fill="#2a1d12" stroke={c} strokeWidth="1.5" />
      <circle cx="242" cy="66" r="20" fill={c} opacity="0.95" filter="url(#glow)" />
      <circle cx="150" cy="118" r="70" fill="none" stroke={c} strokeWidth="2" opacity="0.5" />
    </g>
  ),
  support: (c) => (
    <g opacity="0.95">
      <ellipse cx="150" cy="250" rx="140" ry="40" fill="none" stroke={c} strokeWidth="1.8" opacity="0.6" transform="rotate(-12 150 250)" />
      <circle cx="40" cy="262" r="9" fill={c} filter="url(#glow)" />
      <circle cx="262" cy="226" r="6" fill={c} filter="url(#glow)" />
      <circle cx="150" cy="118" r="66" fill="none" stroke={c} strokeWidth="1.5" opacity="0.45" strokeDasharray="4 8" />
    </g>
  ),
  controller: (c) => (
    <g>
      <circle cx="150" cy="140" r="104" fill="none" stroke={c} strokeWidth="1.6" strokeDasharray="2 10" opacity="0.7" />
      <path d="M60 120 L70 400 L58 400 L48 122 Z" fill="#1a1410" stroke={c} strokeWidth="1.5" />
      <circle cx="54" cy="108" r="16" fill="none" stroke={c} strokeWidth="4" filter="url(#glow)" />
      <circle cx="54" cy="108" r="6" fill={c} />
    </g>
  ),
  assassin: (c) => (
    <g>
      <path d="M96 150 C92 70 120 46 150 44 C180 46 208 70 204 150 C196 120 180 104 150 102 C120 104 104 120 96 150 Z" fill="#0b0a0e" stroke={c} strokeWidth="1.5" />
      <path d="M40 380 L120 270 M260 380 L180 270" stroke="url(#metal)" strokeWidth="7" strokeLinecap="round" />
      <path d="M40 380 L120 270 M260 380 L180 270" stroke={c} strokeWidth="1.2" />
    </g>
  ),
};

function Procedural({ def, kind }: { def: HeroDef; kind: Kind }) {
  const f = FACTIONS[def.faction];
  const r = RARITIES[def.rarity];
  const [p0, p1, p2] = def.palette;
  const gid = `g_${def.id}_${kind}`;
  return (
    <svg viewBox="0 0 300 400" preserveAspectRatio="xMidYMid slice" width="100%" height="100%" style={{ display: 'block' }}>
      <defs>
        <radialGradient id={`${gid}_bg`} cx="50%" cy="30%" r="80%">
          <stop offset="0%" stopColor={f.colors.glow} stopOpacity="0.55" />
          <stop offset="35%" stopColor={f.colors.primary} />
          <stop offset="100%" stopColor="#050408" />
        </radialGradient>
        <linearGradient id="metal" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#5b5f6a" /><stop offset="0.5" stopColor="#23252c" /><stop offset="1" stopColor="#0e0f13" />
        </linearGradient>
        <linearGradient id={`${gid}_body`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1a1720" /><stop offset="1" stopColor="#050407" />
        </linearGradient>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="5" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>
      <rect width="300" height="400" fill={`url(#${gid}_bg)`} />
      <g opacity="0.16" transform="translate(40 30) scale(3.4)"><FactionEmblem id={def.faction} size={64} mono={f.colors.glow} /></g>
      <path d="M0 60 L300 20 L300 26 L0 72 Z" fill={p1} opacity="0.18" />
      <path d="M180 0 L150 80 L170 90 L130 190" stroke="#c9a6ff" strokeWidth="2" fill="none" opacity="0.35" />
      {/* silhouette */}
      <g>
        <path d="M150 64 C182 64 196 92 194 122 C192 150 178 172 150 176 C122 172 108 150 106 122 C104 92 118 64 150 64 Z" fill={`url(#${gid}_body)`} stroke={p1} strokeWidth="2.2" />
        <path d="M130 170 L128 200 C90 206 50 224 30 262 L14 400 H286 L270 262 C250 224 210 206 172 200 L170 170 Z" fill={`url(#${gid}_body)`} stroke={p1} strokeWidth="2.2" />
        <path d="M150 210 L120 300 L150 400 L180 300 Z" fill={p0} opacity="0.35" />
        <path d="M128 200 C140 214 160 214 172 200" stroke={p2} strokeWidth="3" fill="none" opacity="0.8" />
        <path d="M134 118 H146 M154 118 H166" stroke={r.glow} strokeWidth="2.5" strokeLinecap="round" opacity="0.85" filter="url(#glow)" />
      </g>
      {ROLE_PROPS[def.role](p1)}
      <rect width="300" height="400" fill="none" stroke={r.color} strokeWidth="3" opacity="0.5" />
    </svg>
  );
}

export const HeroArt = memo(function HeroArt({ heroId, kind = 'portrait', position = 'center 20%' }: { heroId: string; kind?: Kind; position?: string }) {
  const def = HERO_BY_ID[heroId];
  if (!def) return null;
  const url = heroArtUrl(heroId, kind);
  // Pendant le téléchargement (illustrations chargées à la demande) : une lueur aux couleurs de la faction, pas un cadre vide.
  if (url) return <img className="art-img" src={url} alt={def.name} draggable={false} decoding="async" loading="lazy" onLoad={(e) => e.currentTarget.classList.add('ok')}
    style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: position, display: 'block', ['--ph' as string]: FACTIONS[def.faction]?.colors.primary ?? '#2a2134' }} />;
  return <Procedural def={def} kind={kind} />;
});

export function hasRealArt(heroId: string) { return !!ART[heroId]; }
