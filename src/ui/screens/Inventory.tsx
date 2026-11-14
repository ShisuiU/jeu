import { energyMax } from '../../game/energy';
import { useGame } from '../../state/store';
import { useUI } from '../../state/ui';
import { RESOURCE_LIST } from '../../data/resources';
import { BALANCE } from '../../data/balance';
import { Panel, Screen, fmt } from '../components/common';
import { Icon, ResourceIcon } from '../art/Icons';

const GROUPS: { title: string; ids: string[] }[] = [
  { title: 'Monnaies', ids: ['gold', 'crystals'] },
  { title: 'Invocation', ids: ['shardDim', 'shardAeon', 'shardEpic', 'shardEvent'] },
  { title: 'Progression des héros', ids: ['xpElixir', 'skillTome', 'rankSigil', 'potionMinor', 'awakenEssence', 'masteryScroll'] },
  { title: 'Forge', ids: ['forgeOre'] },
];

// Toutes les ressources sont listées (v1.100.0) : toucher une ressource, même à 0, montre où l'obtenir.
// Seule l'ancienne monnaie convertie (sans source) n'apparaît que si le joueur en a encore.
const LEGACY = ['shardPrimal'];

export function Inventory() {
  const save = useGame((s) => s.save)!;
  return (
    <Screen title="Sac">
      <Panel title="Énergie">
        <div className="row">
          <Icon.energy size={34} />
          <div className="grow">
            <b style={{ fontSize: 18 }}>{save.energy.current}</b> <span className="muted">/ {energyMax(save.profile.level)}</span>
            <div className="faint">+1 toutes les {BALANCE.energy.regenMs / 60000} min, même jeu fermé.</div>
          </div>
        </div>
      </Panel>
      {/* Les doublons de héros ne sont plus listés ici : ils se gèrent depuis l'onglet Héros (Liens) et le Sanctuaire. */}
      {GROUPS.map((g) => ({ g, list: RESOURCE_LIST.filter((r) => g.ids.includes(r.id) && (!LEGACY.includes(r.id) || save.resources[r.id] > 0)) })).filter((x) => x.list.length).map(({ g, list }) => (
        <Panel key={g.title} title={g.title}>
          <div className="res-grid">
            {list.map((r) => (
              <button key={r.id} className={`res-cell ${save.resources[r.id] > 0 ? '' : 'zero'}`} onClick={() => useUI.getState().openSources(r.id)} aria-label={`${r.name} : où l’obtenir`}>
                <ResourceIcon icon={r.icon} color={r.color} size={30} res={r.id} />
                <div className="grow">
                  <b>{fmt(save.resources[r.id])}</b>
                  <div className="faint" style={{ lineHeight: 1.25 }}>{r.name}</div>
                </div>
                <span className="res-get" aria-hidden>+</span>
              </button>
            ))}
          </div>
        </Panel>
      ))}
    </Screen>
  );
}
