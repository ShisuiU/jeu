import { useUI } from '../../state/ui';
import type { Reward } from '../../data/resources';
import { RESOURCES, normalizeReward, type ResourceId } from '../../data/resources';
import { ResourceIcon, Icon } from '../art/Icons';
import { fmt } from './common';
import type { GearItem } from '../../save/schema';
import { useState } from 'react';
import { GearCard, statText } from './GearCard';
import { GearDetail } from './GearDetail';
import { GEAR_RARITIES, SETS, SLOT_BY_ID } from '../../data/equipment';
import { GearStars, SetEmblem } from '../art/SetEmblem';
import { defaultStars, mainValue } from '../../game/gear';

export function RewardView({ reward: rawReward, gear = [], compact }: { reward: Reward; gear?: GearItem[]; compact?: boolean }) {
  const reward = normalizeReward(rawReward);
  // Grille équilibrée : 4 récompenses sur une ligne, 5 ou 6 en deux lignes de 3 (jamais une seule toute seule).
  // L'équipement gagné se range dans la même grille, à côté de l'or et des ressources.
  const n = Object.keys(reward).length + gear.length;
  // L'équipement gagné s'ouvre d'un toucher : sa fiche complète (statistiques, ensemble, renforcer…). (v1.70.1)
  const [open, setOpen] = useState<string | null>(null);
  const detail = open && <GearDetail gearUid={open} place="forge" onClose={() => setOpen(null)} />;
  const cols = n <= 4 ? n : n <= 6 ? 3 : 4;
  // Version compacte (écran de victoire) : petites tuiles horizontales, icône à gauche, quantité et nom à droite.
  // Les ressources se partagent toute la largeur (1 à 3 par ligne, 4 en 2×2) ; chaque objet a sa propre ligne en dessous (v1.71.1).
  const nr = Object.keys(reward).length;
  const rcols = nr === 4 ? 2 : Math.max(1, Math.min(3, nr));
  if (compact) return (
    <div className="reward-compact" style={{ ['--rc-cols' as string]: rcols }}>
      {Object.entries(reward).map(([k, v], i) => {
        const def = k === 'energy' ? null : RESOURCES[k as keyof typeof RESOURCES];
        if (k !== 'energy' && !def) return null;
        return (
          <div key={k} className="rc-item" style={{ animationDelay: `${i * 0.06}s` }} {...srcProps(k)}>
            {def ? <ResourceIcon icon={def.icon} color={def.color} size={30} res={k} /> : <Icon.energy size={28} />}
            <span className="rc-txt"><b>{fmt(v ?? 0)}</b><small>{def ? def.name : 'Énergie'}</small></span>
          </div>
        );
      })}
      {gear.map((g, i) => {
        const r = GEAR_RARITIES[g.rarity];
        return (
          <div key={g.uid} role="button" tabIndex={0} aria-label="Voir l’équipement" className="rc-item rc-gear" style={{ animationDelay: `${(nr + i) * 0.06}s`, ['--gc' as string]: r.color }}
            onClick={() => setOpen(g.uid)} onKeyDown={(e) => { if (e.key === 'Enter') setOpen(g.uid); }}>
            <span className="rc-gc"><GearCard g={g} hideMain /></span>
            <span className="rc-gtxt">
              <span className="rc-gname"><b>{SLOT_BY_ID[g.slot].name}</b><em>{r.name}</em><GearStars n={g.stars ?? defaultStars(g.rarity)} size={11} /></span>
              <span className="rc-gstat"><b>{statText(g.main, mainValue(g))}</b><span style={{ color: SETS[g.set].color }}><SetEmblem id={g.set} size={12} /> {SETS[g.set].name}</span></span>
            </span>
            <span className="rc-chev" aria-hidden>›</span>
          </div>
        );
      })}
      {detail}
    </div>
  );
  return (
    <div className="reward-list" style={{ ['--n' as string]: Math.max(1, cols) }}>
      {Object.entries(reward).map(([k, v], i) => {
        const def = k === 'energy' ? null : RESOURCES[k as keyof typeof RESOURCES];
        if (k !== 'energy' && !def) return null;
        return (
          <div key={k} className="reward-item" style={{ animationDelay: `${i * 0.08}s` }} {...srcProps(k)}>
            {def ? <ResourceIcon icon={def.icon} color={def.color} size={34} res={k} /> : <Icon.energy size={34} />}
            <b>{fmt(v ?? 0)}</b>
            <span className="muted">{def ? def.name : 'Énergie'}</span>
          </div>
        );
      })}
      {gear.map((g, i) => (
        <div key={g.uid} className="reward-item reward-gear" style={{ animationDelay: `${(Object.keys(reward).length + i) * 0.08}s` }}>
          <GearCard g={g} onClick={() => setOpen(g.uid)} />
          <span className="muted">{statText(g.main, mainValue(g))}</span>
        </div>
      ))}
      {detail}
    </div>
  );
}

/** Toucher une ressource reçue : où en obtenir d'autres (v1.100.0). */
function srcProps(k: string) {
  if (!(k in RESOURCES)) return {};
  const open = () => useUI.getState().openSources(k as ResourceId);
  return { role: 'button', tabIndex: 0, 'aria-label': `${RESOURCES[k as ResourceId].name} : où l’obtenir`, onClick: open, onKeyDown: (e: { key: string }) => { if (e.key === 'Enter') open(); } };
}

export function rewardMainIcon(raw: Reward, size = 20) {
  const r = normalizeReward(raw);
  const k = Object.keys(r)[0];
  if (!k || k === 'energy') return <Icon.energy size={size} />;
  const def = RESOURCES[k as keyof typeof RESOURCES];
  if (!def) return <Icon.energy size={size} />;
  return <ResourceIcon icon={def.icon} color={def.color} size={size} />;
}

/** Récompenses sur une ligne (icône + quantité), pour les écrans où la place compte. */
export function RewardInline({ reward: raw }: { reward: Reward }) {
  const reward = normalizeReward(raw);
  return (
    <div className="reward-inline">
      {Object.entries(reward).filter(([, v]) => (v ?? 0) > 0).map(([k, v]) => {
        const d = RESOURCES[k as keyof typeof RESOURCES];
        if (!d) return null;
        return <span key={k} title={d.name}><ResourceIcon icon={d.icon} color={d.color} size={18} /><b>{fmt(v ?? 0)}</b><small>{d.name}</small></span>;
      })}
    </div>
  );
}
