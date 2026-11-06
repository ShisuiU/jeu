import { useGame } from '../../state/store';
import { useUI } from '../../state/ui';
import { RESOURCE_LIST } from '../../data/resources';
import { BALANCE } from '../../data/balance';
import { Panel, Screen, fmt } from '../components/common';
import { Icon, ResourceIcon } from '../art/Icons';
import { HERO_BY_ID } from '../../data/heroes';

const GROUPS: { title: string; ids: string[] }[] = [
  { title: 'Monnaies', ids: ['gold', 'crystals'] },
  { title: 'Invocation', ids: ['shardDim', 'shardAeon', 'shardEvent'] },
  { title: 'Progression des héros', ids: ['xpElixir', 'skillTome', 'rankSigil', 'potionMinor', 'potionGreater', 'potionSupreme', 'awakenEssence'] },
  { title: 'Forge', ids: ['forgeOre'] },
];

export function Inventory() {
  const save = useGame((s) => s.save)!;
  const toast = useUI((s) => s.toast);
  const push = useUI((s) => s.push);
  return (
    <Screen title="Sac">
      <Panel title="Énergie">
        <div className="row">
          <Icon.energy size={34} />
          <div className="grow">
            <b style={{ fontSize: 18 }}>{save.energy.current}</b> <span className="muted">/ {BALANCE.energy.max}</span>
            <div className="faint">+1 toutes les {BALANCE.energy.regenMs / 60000} min, même jeu fermé.</div>
          </div>
        </div>
      </Panel>
      {Object.values(save.heroCopies).some((n) => n > 0) && (
        <Panel title="Doublons de héros">
          {Object.entries(save.heroCopies).filter(([, n]) => n > 0).map(([id, n]) => {
            const h = save.heroes.find((x) => x.heroId === id);
            return (
              <button key={id} className="stat-row" style={{ width: '100%' }} disabled={!h} onClick={() => h && push({ name: 'hero', uid: h.uid, heroId: id })}>
                <span>{HERO_BY_ID[id]?.name ?? id}</span><b>×{n} ›</b>
              </button>
            );
          })}
        </Panel>
      )}
      {GROUPS.map((g) => (
        <Panel key={g.title} title={g.title}>
          <div className="res-grid">
            {RESOURCE_LIST.filter((r) => g.ids.includes(r.id)).map((r) => (
              <button key={r.id} className="res-cell" onClick={() => toast(`${r.name} : ${r.description}`)}>
                <ResourceIcon icon={r.icon} color={r.color} size={30} />
                <div className="grow">
                  <b>{fmt(save.resources[r.id])}</b>
                  <div className="faint" style={{ lineHeight: 1.25 }}>{r.name}</div>
                </div>
              </button>
            ))}
          </div>
        </Panel>
      ))}
    </Screen>
  );
}
