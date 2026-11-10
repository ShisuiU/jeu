import type { Reward } from '../../data/resources';
import { RESOURCES } from '../../data/resources';
import { ResourceIcon, Icon } from '../art/Icons';
import { fmt } from './common';
import type { GearItem } from '../../save/schema';
import { GearCard } from './GearCard';

export function RewardView({ reward, gear = [] }: { reward: Reward; gear?: GearItem[] }) {
  // Grille équilibrée : 4 récompenses sur une ligne, 5 ou 6 en deux lignes de 3 (jamais une seule toute seule).
  // L'équipement gagné se range dans la même grille, à côté de l'or et des ressources.
  const n = Object.keys(reward).length + gear.length;
  const cols = n <= 4 ? n : n <= 6 ? 3 : 4;
  return (
    <div className="reward-list" style={{ ['--n' as string]: Math.max(1, cols) }}>
      {Object.entries(reward).map(([k, v], i) => {
        const def = k === 'energy' ? null : RESOURCES[k as keyof typeof RESOURCES];
        return (
          <div key={k} className="reward-item" style={{ animationDelay: `${i * 0.08}s` }}>
            {def ? <ResourceIcon icon={def.icon} color={def.color} size={34} res={k} /> : <Icon.energy size={34} />}
            <b>{fmt(v ?? 0)}</b>
            <span className="muted">{def ? def.name : 'Énergie'}</span>
          </div>
        );
      })}
      {gear.map((g, i) => (
        <div key={g.uid} className="reward-item reward-gear" style={{ animationDelay: `${(Object.keys(reward).length + i) * 0.08}s` }}>
          <GearCard g={g} />
          <span className="muted">Nouvel équipement</span>
        </div>
      ))}
    </div>
  );
}

export function rewardMainIcon(r: Reward, size = 20) {
  const k = Object.keys(r)[0];
  if (!k || k === 'energy') return <Icon.energy size={size} />;
  const def = RESOURCES[k as keyof typeof RESOURCES];
  return <ResourceIcon icon={def.icon} color={def.color} size={size} />;
}

/** Récompenses sur une ligne (icône + quantité), pour les écrans où la place compte. */
export function RewardInline({ reward }: { reward: Reward }) {
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
