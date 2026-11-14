import { useGame } from '../../state/store';
import { useUI } from '../../state/ui';
import { RESOURCES, type ResourceId } from '../../data/resources';
import { sourcesOf, type Source } from '../../game/sources';
import { Icon, ResourceIcon } from '../art/Icons';
import { Modal, fmt } from './common';
import { play } from '../../audio/sfx';

// FENÊTRE « OBTENIR » (v1.100.0) — où trouver une ressource, et y aller en un geste.
// Les sources viennent du registre central (game/sources.ts) : rien n'est écrit à la main ici.

type IconName = keyof typeof Icon;
const ACT_ICON: Record<string, IconName> = {
  campaign: 'sword', starChests: 'star', factionDungeon: 'temple', tower: 'tower', towerChallenges: 'tower', rifts: 'portal',
  worldboss: 'skull', arena: 'arena', guild: 'team', dailyMissions: 'scroll', weeklyMissions: 'scroll', achievements: 'star',
  weeklyEvent: 'calendar', specialEvents: 'calendar', dailyLogin: 'mail', wheel: 'wheel', market: 'coin', camp: 'gift',
  expeditions: 'loop', mine: 'diamond', collection: 'heroes', dismantle: 'forge',
};
const iconOf = (id: string): IconName => ACT_ICON[id] ?? (id.startsWith('dungeon_') ? 'dungeon' : 'gem');

/** Bouton discret « Obtenir » à poser à côté d'une ressource. */
export function GetButton({ res, label = false }: { res: ResourceId; label?: boolean }) {
  const open = useUI((s) => s.openSources);
  return (
    <button className={`get-btn ${label ? 'with-label' : ''}`} aria-label={`Obtenir : ${RESOURCES[res].name}`} onClick={(e) => { e.stopPropagation(); open(res); }}>
      <span aria-hidden>+</span>{label && <b>Obtenir</b>}
    </button>
  );
}

export function SourcesModal() {
  const res = useUI((s) => s.sources);
  const close = useUI((s) => s.closeSources);
  const save = useGame((s) => s.save);
  const now = useGame((s) => s.now);
  if (!res || !save) return null;
  const def = RESOURCES[res];
  const list = sourcesOf(save, res, now);
  const go = (src: Source) => {
    const ui = useUI.getState();
    if (src.status === 'locked') { play('error'); ui.toast(`${src.activity.name} : ${src.reason}.`); return; }
    close();
    const cur = ui.stack[ui.stack.length - 1];
    if (JSON.stringify(cur) === JSON.stringify(src.activity.route)) return; // déjà sur place
    ui.push(src.activity.route);
  };
  const open = list.filter((x) => x.status !== 'locked');
  const locked = list.filter((x) => x.status === 'locked');
  const Row = (src: Source) => {
    const I = Icon[iconOf(src.activity.id)] as (p: { size?: number }) => JSX.Element;
    return (
      <button key={src.activity.id} className={`src-row ${src.status}`} onClick={() => go(src)}>
        <span className="src-ic"><I size={18} /></span>
        <span className="src-txt">
          <b>{src.activity.name}</b>
          <small>{src.status === 'open' ? src.activity.hint : src.reason}</small>
        </span>
        {src.amount && <em className="src-amt">{src.amount}</em>}
        <span className="src-go" aria-hidden>{src.status === 'locked' ? <Icon.lock size={14} /> : '›'}</span>
      </button>
    );
  };
  return (
    <Modal onClose={close}>
      <div className="src-head">
        <span className="src-res"><ResourceIcon icon={def.icon} color={def.color} size={44} res={res} /></span>
        <div className="src-title">
          <h2>{def.name}</h2>
          <span>Tu en as <b>{fmt(save.resources[res] ?? 0)}</b></span>
        </div>
      </div>
      <p className="src-desc">{def.description}</p>
      {list.length === 0 ? (
        <div className="src-none">Aucune source pour le moment.</div>
      ) : (
        <div className="src-list" role="list">
          {open.map(Row)}
          {locked.length > 0 && <div className="src-sep">À débloquer</div>}
          {locked.map(Row)}
        </div>
      )}
    </Modal>
  );
}
