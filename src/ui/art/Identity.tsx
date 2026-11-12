import { useState } from 'react';
import { AFFINITIES } from '../../data/affinities';
import { ROLES } from '../../data/roles';
import { FACTIONS } from '../../data/factions';
import { RARITIES } from '../../data/rarities';
import type { AffinityId, FactionId, RarityId, RoleId } from '../../data/types';
import { FactionEmblem } from './FactionEmblem';
import { ModalX } from '../components/common';

// IDENTITÉ D'UN PERSONNAGE — logos communs à tous ceux qui partagent une affinité ou un rôle,
// et bandeau « rareté · affinité · rôle · famille » de la fiche (chaque pastille s'explique au toucher).

// Symboles d'affinité peints (SpriteCook, v1.74.0) : soleil, montagne, croissant, étoile du Néant.
const AFF_IMG = import.meta.glob('../../assets/identity/aff_*.webp', { eager: true, import: 'default' }) as Record<string, string>;
const affSrc = (id: AffinityId) => AFF_IMG[`../../assets/identity/aff_${id}.webp`];

/** Symbole d'affinité, lisible même en tout petit. */
export function AffinityIcon({ id, size = 16 }: { id: AffinityId; size?: number; plain?: boolean }) {
  return <img className="aff-icon" src={affSrc(id)} width={size} height={size} alt={AFFINITIES[id].name} title={AFFINITIES[id].name} draggable={false} />;
}

// Icônes de rôle peintes (SpriteCook, v1.74.0) : épée, bouclier, bannière, croix, chaîne, dague.
const ROLE_IMG = import.meta.glob('../../assets/identity/role_*.webp', { eager: true, import: 'default' }) as Record<string, string>;

/** Icône de rôle. */
export function RoleIcon({ id, size = 16 }: { id: RoleId; size?: number }) {
  return <img className="role-icon" src={ROLE_IMG[`../../assets/identity/role_${id}.webp`]} width={size} height={size} alt={ROLES[id].name} title={ROLES[id].name} draggable={false} />;
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
    { k: 'affinity' as const, icon: <AffinityIcon id={affinity} size={22} />, label: a.name, color: a.color, title: `Affinité : ${a.name}`, text: `${a.description} ${AFF_TEXT(affinity)}` },
    { k: 'role' as const, icon: <RoleIcon id={role} size={22} />, label: ro.name, color: '#d9cdb4', title: `Rôle : ${ro.name}`, text: ro.description },
    { k: 'faction' as const, icon: <FactionEmblem id={faction} size={26} />, label: f.short, color: f.colors.glow, title: f.name, text: f.synergy },
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
          <div className="modal-wrap" onClick={(e) => e.stopPropagation()}>
            <div className="modal info-modal">
              <h2 style={{ color: cur.color }}>{cur.title}</h2>
              <div className="info-text">{cur.text}</div>
              <button className="btn secondary block" onClick={() => setOpen(null)}>Compris</button>
            </div>
            <ModalX onClose={() => setOpen(null)} />
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
