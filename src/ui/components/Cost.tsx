import { RESOURCES } from '../../data/resources';
import type { Cost } from '../../game/upgrade';
import type { SaveData } from '../../save/schema';
import { ResourceIcon, Icon } from '../art/Icons';
import { fmt } from './common';

/** Affiche un coût ; en rouge ce que le joueur ne possède pas en quantité suffisante. */
export function CostView({ cost, save, heroId }: { cost: Cost; save: SaveData; heroId?: string }) {
  return (
    <span className="cost">
      {Object.entries(cost).map(([k, v]) => {
        if (!v) return null;
        if (k === 'fragments') {
          const have = heroId ? save.heroFragments[heroId] ?? 0 : 0;
          return <span key={k} className={have < v ? 'lack' : ''}><Icon.gem size={14} /> {have}/{v} fragments</span>;
        }
        const def = RESOURCES[k as keyof typeof RESOURCES];
        const have = save.resources[k as keyof typeof save.resources] ?? 0;
        return <span key={k} className={have < v ? 'lack' : ''} title={def.name}><ResourceIcon icon={def.icon} color={def.color} size={15} /> {fmt(v)}</span>;
      })}
    </span>
  );
}
