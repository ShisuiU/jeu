import { cloudWanted, useAccount } from '../../cloud/account';
import { useGame } from '../../state/store';
import { useUI, type Route } from '../../state/ui';
import { Screen } from '../components/common';
import { Icon } from '../art/Icons';

type Entry = { label: string; icon: keyof typeof Icon; route: Route; dot?: boolean };

export function Menu() {
  const push = useUI((s) => s.push);
  const save = useGame((s) => s.save)!;
  // Le Menu ne contient que ce qui n'a pas de place ailleurs : chaque écran n'a qu'une seule entrée.
  // (Missions, Événements, Courrier, Sanctuaire et Forge sont sur l'Accueil ; Équipes et Liens dans Héros.)
  const groups: { title: string; items: Entry[] }[] = [
    { title: 'Ma partie', items: [
      { label: 'Sac', icon: 'bag', route: { name: 'inventory' } },
      { label: 'Codex', icon: 'book', route: { name: 'codex' } },
      { label: 'Classements', icon: 'star', route: { name: 'ranks' } },
    ] },
    { title: 'Système', items: [
      { label: 'Sauvegarde et compte', icon: 'save', route: { name: 'saves' }, dot: !useAccount.getState().user && !cloudWanted() && save.stats.battlesWon >= 3 },
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
      <p className="faint menu-map">Missions, Événements, Courrier, Sanctuaire et Forge : sur l’<b>Accueil</b>. Équipes et liens : dans <b>Héros</b>.</p>
    </Screen>
  );
}
