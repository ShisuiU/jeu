import { useGame } from '../../state/store';
import { useUI } from '../../state/ui';
import { RESOURCES, type ResourceId } from '../../data/resources';
import { ResourceIcon } from '../art/Icons';
import { fmt } from './common';

/** Porte-monnaie : ce que le joueur possède, pour les ressources utiles à l'écran. Toucher = où l'obtenir (v1.100.0). */
export function Wallet({ ids, cols = 4 }: { ids: ResourceId[]; cols?: number }) {
  const save = useGame((s) => s.save)!;
  const open = useUI((s) => s.openSources);
  return (
    <div className="wallet" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }} aria-label="Porte-monnaie">
      {ids.map((id) => {
        const r = RESOURCES[id];
        return (
          <button key={id} className="wallet-item" onClick={() => open(id)} aria-label={`${r.name} : ${save.resources[id] ?? 0}, où l’obtenir`}>
            <ResourceIcon icon={r.icon} color={r.color} size={15} /><b>{fmt(save.resources[id] ?? 0)}</b><span className="res-get" aria-hidden>+</span>
          </button>
        );
      })}
    </div>
  );
}
