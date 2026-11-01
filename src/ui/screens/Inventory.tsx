import { useGame } from '../../state/store';
import { RESOURCE_LIST } from '../../data/resources';
import { BALANCE } from '../../data/balance';
import { Panel, Screen, fmt } from '../components/common';
import { Icon, ResourceIcon } from '../art/Icons';
import { HERO_BY_ID } from '../../data/heroes';
import { RARITIES } from '../../data/rarities';

const GROUPS: { title: string; ids: string[] }[] = [
  { title: 'Monnaies', ids: ['gold', 'crystals'] },
  { title: 'Invocation', ids: ['shardDim', 'shardAeon', 'shardPrimal', 'shardEvent'] },
  { title: 'Progression des héros', ids: ['xpElixir', 'skillTome', 'rankSigil', 'potionMinor', 'potionGreater', 'potionSupreme', 'awakenEssence'] },
  { title: 'Forge', ids: ['forgeOre'] },
];

export function Inventory() {
  const save = useGame((s) => s.save)!;
  return (
    <Screen title="Sac">
      <Panel title="Énergie">
        <div className="row">
          <Icon.energy size={34} />
          <div className="grow">
            <b style={{ fontSize: 18 }}>{save.energy.current}</b> <span className="muted">/ {BALANCE.energy.max}</span>
            <div className="faint">Sert à lancer les combats. +1 toutes les {BALANCE.energy.regenMs / 60000} minutes, même jeu fermé.</div>
          </div>
        </div>
      </Panel>
      <Panel title="Fragments de héros">
        {Object.entries(save.heroFragments).filter(([, n]) => n > 0).length === 0 && <p className="faint">Aucun fragment. Les héros invoqués en double sont convertis en fragments.</p>}
        {Object.entries(save.heroFragments).filter(([, n]) => n > 0).map(([id, n]) => (
          <div key={id} className="stat-row"><span>{HERO_BY_ID[id]?.name ?? id}</span><b>{n}{!save.heroes.some((h) => h.heroId === id) ? ` / ${RARITIES[HERO_BY_ID[id].rarity].fragmentsToSummon}` : ''}</b></div>
        ))}
      </Panel>
      {GROUPS.map((g) => (
        <Panel key={g.title} title={g.title}>
          <div className="res-grid">
            {RESOURCE_LIST.filter((r) => g.ids.includes(r.id)).map((r) => (
              <div key={r.id} className="res-cell">
                <ResourceIcon icon={r.icon} color={r.color} size={30} />
                <div className="grow">
                  <b>{fmt(save.resources[r.id])}</b>
                  <div className="faint" style={{ lineHeight: 1.25 }}>{r.name}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="faint" style={{ marginTop: 8 }}>
            {RESOURCE_LIST.filter((r) => g.ids.includes(r.id)).map((r) => <div key={r.id}>• <b>{r.name}</b> : {r.description}</div>)}
          </div>
        </Panel>
      ))}
    </Screen>
  );
}
