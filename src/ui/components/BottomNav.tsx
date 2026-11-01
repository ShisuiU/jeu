import { useUI, type Tab } from '../../state/ui';
import { useGame } from '../../state/store';
import { canClaimDaily } from '../../game/daily';
import { Icon } from '../art/Icons';

const ITEMS: { tab: Tab; label: string; icon: keyof typeof Icon }[] = [
  { tab: 'home', label: 'Accueil', icon: 'home' },
  { tab: 'collection', label: 'Héros', icon: 'heroes' },
  { tab: 'team', label: 'Équipe', icon: 'team' },
  { tab: 'inventory', label: 'Sac', icon: 'bag' },
  { tab: 'menu', label: 'Menu', icon: 'menu' },
];

export function BottomNav() {
  const root = useUI((s) => s.stack[0].name);
  const tab = useUI((s) => s.tab);
  const daily = useGame((s) => (s.save ? canClaimDaily(s.save, s.now) : false));
  return (
    <nav className="bottom-nav">
      {ITEMS.map((it) => {
        const I = Icon[it.icon] as (p: { size?: number }) => JSX.Element;
        return (
          <button key={it.tab} className={`nav-item ${root === it.tab ? 'active' : ''}`} onClick={() => tab(it.tab)}>
            <I />
            {it.label}
            {it.tab === 'menu' && daily && <span className="badge-dot" />}
          </button>
        );
      })}
    </nav>
  );
}
