import { useGame } from '../../state/store';
import { useUI, type Route } from '../../state/ui';
import { canClaimDaily } from '../../game/daily';
import { claimableCount } from '../../game/missions';
import { Screen } from '../components/common';
import { Icon } from '../art/Icons';
import { unreadMail } from './Mail';

type Entry = { label: string; icon: keyof typeof Icon; route: Route; dot?: boolean };

export function Menu() {
  const push = useUI((s) => s.push);
  const save = useGame((s) => s.save)!;
  const now = useGame((s) => s.now);
  const groups: { title: string; items: Entry[] }[] = [
    { title: 'Chaque jour', items: [
      { label: 'Missions', icon: 'scroll', route: { name: 'missions' }, dot: claimableCount(save) > 0 },
      { label: 'Connexion', icon: 'gift', route: { name: 'daily' }, dot: canClaimDaily(save, now) },
      { label: 'Courrier', icon: 'mail', route: { name: 'mail' }, dot: unreadMail(save.flags) },
      { label: 'Événements', icon: 'calendar', route: { name: 'events' } },
    ] },
    { title: 'Collection', items: [
      { label: 'Équipes', icon: 'team', route: { name: 'team' } },
      { label: 'Sac', icon: 'bag', route: { name: 'inventory' } },
      { label: 'Forge', icon: 'forge', route: { name: 'gear' } },
    ] },
    { title: 'Univers', items: [{ label: 'Codex', icon: 'book', route: { name: 'codex' } }] },
    { title: 'Système', items: [
      { label: 'Sauvegarde', icon: 'save', route: { name: 'saves' } },
      { label: 'Paramètres', icon: 'gear', route: { name: 'settings' } },
    ] },
  ];
  return (
    <Screen title="Menu">
      {groups.map((g) => (
        <div key={g.title} className="menu-group">
          <div className="menu-title">{g.title}</div>
          <div className="menu-grid">
            {g.items.map((e) => {
              const I = Icon[e.icon] as (p: { size?: number }) => JSX.Element;
              return (
                <button key={e.label} className="menu-tile" onClick={() => push(e.route)}>
                  <I size={24} />
                  <span>{e.label}</span>
                  {e.dot && <span className="badge-dot" style={{ top: 8, right: 10 }} />}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </Screen>
  );
}
