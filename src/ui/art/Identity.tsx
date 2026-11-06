import { useState, type ReactNode } from 'react';
import { AFFINITIES } from '../../data/affinities';
import { ROLES } from '../../data/roles';
import { FACTIONS } from '../../data/factions';
import { RARITIES } from '../../data/rarities';
import type { AffinityId, FactionId, RarityId, RoleId } from '../../data/types';
import { FactionEmblem } from './FactionEmblem';

// IDENTITÉ D'UN PERSONNAGE — logos communs à tous ceux qui partagent une affinité ou un rôle,
// et bandeau « rareté · affinité · rôle · famille » de la fiche (chaque pastille s'explique au toucher).

/** Logo d'affinité : soleil (Solaire), montagne (Tellurique), croissant (Lunaire), faille-œil (Néant). */
export function AffinityIcon({ id, size = 16, plain }: { id: AffinityId; size?: number; plain?: boolean }) {
  const c = AFFINITIES[id].color;
  const glyph: Record<AffinityId, ReactNode> = {
    solar: (<g fill={c}><circle cx="12" cy="12" r="4.2" />{Array.from({ length: 8 }, (_, i) => <path key={i} d="M12 1.6 13.2 5.4h-2.4z" transform={`rotate(${i * 45} 12 12)`} />)}</g>),
    telluric: (<g fill={c}><path d="M2.5 19.5 9 8l3 5 2.5-4 7 10.5z" /><path d="M9 8l1.6 2.8-1.6.9-1.5-1z" fill="#fff" opacity="0.55" /></g>),
    lunar: (<path d="M15.5 3.2a8.8 8.8 0 1 0 5.3 15.4A7 7 0 0 1 15.5 3.2z" fill={c} />),
    void: (<g><path d="M2 12c3-5 7-7 10-7s7 2 10 7c-3 5-7 7-10 7S5 17 2 12z" fill="none" stroke={c} strokeWidth="1.8" /><path d="M12 6.5 13.6 12 12 17.5 10.4 12z" fill={c} /></g>),
  };
  return (
    <svg className={`aff-icon ${plain ? '' : 'disc'}`} viewBox="0 0 24 24" width={size} height={size} aria-label={AFFINITIES[id].name} style={{ ['--ac' as string]: c }}>
      {glyph[id]}
    </svg>
  );
}

/** Logo de rôle. */
export function RoleIcon({ id, size = 16 }: { id: RoleId; size?: number }) {
  const p: Record<RoleId, ReactNode> = {
    attacker: <><path d="M14 3h7v7L9.5 21.5l-7-7z" /><path d="m5 13 6 6" /></>,
    defender: <path d="M12 2.5 4 5.5v6c0 5 3.4 8.6 8 10 4.6-1.4 8-5 8-10v-6z" />,
    support: <><path d="M6 21V3" /><path d="M6 4h11l-2.5 4L17 12H6" /></>,
    healer: <path d="M9.5 3h5v6.5H21v5h-6.5V21h-5v-6.5H3v-5h6.5z" />,
    controller: <><circle cx="8" cy="12" r="4" /><circle cx="16" cy="12" r="4" /></>,
    assassin: <><path d="M4 20 15.5 8.5l2 2L6 22z" /><path d="m15 4 5 5-2.5 1.5-4-4z" /></>,
  };
  return (
    <svg className="role-icon" viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-label={ROLES[id].name}>{p[id]}</svg>
  );
}

const AFF_TEXT = (id: AffinityId) => {
  const a = AFFINITIES[id];
  const weakTo = (Object.values(AFFINITIES).find((x) => x.strongAgainst === id));
  if (!a.strongAgainst) return '';
  return `Fort contre ${AFFINITIES[a.strongAgainst].name} (+30 % de dégâts). Faible contre ${weakTo?.name ?? '—'} (−20 %).`;
};

/** Bandeau d'identité de la fiche : rareté, affinité, rôle, famille. Toucher une pastille l'explique. */
export function IdentityStrip({ rarity, affinity, role, faction }: { rarity: RarityId; affinity: AffinityId; role: RoleId; faction: FactionId }) {
  const [open, setOpen] = useState<null | 'rarity' | 'affinity' | 'role' | 'faction'>(null);
  const r = RARITIES[rarity], a = AFFINITIES[affinity], ro = ROLES[role], f = FACTIONS[faction];
  const items = [
    { k: 'rarity' as const, icon: <span className="id-stars" style={{ color: r.color }}>{'★'.repeat(r.order)}</span>, label: r.name, color: r.color, title: `Rareté : ${r.name}`, text: `${r.order} étoile(s). Plus la rareté est haute, plus les statistiques de base sont fortes.` },
    { k: 'affinity' as const, icon: <AffinityIcon id={affinity} size={18} />, label: a.name, color: a.color, title: `Affinité : ${a.name}`, text: `${a.description} ${AFF_TEXT(affinity)}` },
    { k: 'role' as const, icon: <RoleIcon id={role} size={17} />, label: ro.name, color: '#d9cdb4', title: `Rôle : ${ro.name}`, text: ro.description },
    { k: 'faction' as const, icon: <FactionEmblem id={faction} size={18} />, label: f.short, color: f.colors.glow, title: f.name, text: f.synergy },
  ];
  const cur = items.find((x) => x.k === open);
  return (
    <>
      <div className="identity">
        {items.map((it) => (
          <button key={it.k} className="id-item" style={{ ['--ic' as string]: it.color }} onClick={() => setOpen(it.k)} aria-label={it.title}>
            <span className="id-ic">{it.icon}</span>
            <span className="id-lb">{it.label}</span>
          </button>
        ))}
      </div>
      {cur && (
        <div className="modal-backdrop" onClick={() => setOpen(null)}>
          <div className="modal info-modal" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ color: cur.color }}>{cur.title}</h2>
            <div className="info-text">{cur.text}</div>
            <button className="btn secondary block" onClick={() => setOpen(null)}>Compris</button>
          </div>
        </div>
      )}
    </>
  );
}

/** Avantage d'affinité d'un attaquant contre une cible : 1 avantage, −1 faiblesse, 0 neutre. */
export function affinityEdge(attacker: AffinityId, target: AffinityId): -1 | 0 | 1 {
  if (AFFINITIES[attacker].strongAgainst === target) return 1;
  if (AFFINITIES[target].strongAgainst === attacker) return -1;
  return 0;
}
