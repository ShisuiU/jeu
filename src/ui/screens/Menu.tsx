import { useGame } from '../../state/store';
import { comingSoon, useUI, type Route } from '../../state/ui';
import { canClaimDaily } from '../../game/daily';
import { Screen } from '../components/common';
import { Icon } from '../art/Icons';
import { unreadMail } from './Mail';

export function Menu() {
  const push = useUI((s) => s.push);
  const daily = useGame((s) => canClaimDaily(s.save!, s.now));
  const mail = useGame((s) => unreadMail(s.save!.flags));
  const entries: { label: string; sub: string; icon: keyof typeof Icon; route?: Route; soon?: [string, number]; dot?: boolean }[] = [
    { label: 'Récompense de connexion', sub: 'Une récompense par jour', icon: 'gift', route: { name: 'daily' }, dot: daily },
    { label: 'Courrier', sub: 'Cadeaux et messages', icon: 'scroll', route: { name: 'mail' }, dot: mail },
    { label: 'Invocation', sub: 'Obtenir de nouveaux héros', icon: 'portal', route: { name: 'summon' } },
    { label: 'Équipement et forge', sub: 'Améliorer, démanteler', icon: 'forge', route: { name: 'gear' } },
    { label: 'Codex', sub: 'Histoire, factions, affinités', icon: 'book', route: { name: 'codex' } },
    { label: 'Sauvegarde', sub: 'Exporter, importer, restaurer', icon: 'save', route: { name: 'saves' } },
    { label: 'Paramètres', sub: 'Profil, son, animations', icon: 'gear', route: { name: 'settings' } },
    { label: 'Missions', sub: 'Journalières et hebdomadaires', icon: 'scroll', soon: ['Missions', 4] },
    { label: 'Arène', sub: 'Contre des équipes de l’IA', icon: 'arena', soon: ['Arène', 4] },
    { label: 'Boss mondial', sub: 'Plusieurs niveaux de difficulté', icon: 'skull', soon: ['Boss mondial', 4] },
  ];
  return (
    <Screen title="Menu">
      <div className="stack">
        {entries.map((e) => {
          const I = Icon[e.icon] as (p: { size?: number }) => JSX.Element;
          return (
            <button key={e.label} className="panel row" style={{ width: '100%', textAlign: 'left', opacity: e.soon ? 0.6 : 1 }}
              onClick={() => (e.route ? push(e.route) : e.soon && comingSoon(...e.soon))}>
              <span style={{ color: 'var(--gold)', position: 'relative' }}><I size={28} />{e.dot && <span className="badge-dot" style={{ top: -4, right: -4 }} />}</span>
              <div className="grow"><div style={{ fontWeight: 700 }}>{e.label}</div><div className="faint">{e.sub}</div></div>
              {e.soon ? <span className="lock-tag" style={{ position: 'static' }}>PHASE {e.soon[1]}</span> : <span className="muted">›</span>}
            </button>
          );
        })}
      </div>
    </Screen>
  );
}
