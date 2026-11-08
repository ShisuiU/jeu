import { cloudWanted, useAccount } from '../../cloud/account';
import { isUnlocked } from '../../game/unlocks';
import { useGame } from '../../state/store';
import { useUI, type Route } from '../../state/ui';
import { useEffect, useState } from 'react';
import { Modal, Screen, fmt } from '../components/common';
import { Icon } from '../art/Icons';
import { HeroArt } from '../art/HeroArt';
import { HEROES } from '../../data/heroes';
import { TOWER_FLOORS } from '../../data/tower';
import { arenaTier } from '../../data/arena';
import { campProgress } from '../../game/camp';
import { cleanName, nameError } from '../../game/profile';

type Entry = { label: string; icon: keyof typeof Icon; route: Route; dot?: boolean };

export function Menu() {
  const push = useUI((s) => s.push);
  const save = useGame((s) => s.save)!;
  // Le Menu ne contient que ce qui n'a pas de place ailleurs : chaque écran n'a qu'une seule entrée.
  // (Accueil : Missions, Courrier, Événements, Camp, Marché. Héros : Sanctuaire, Forge, Équipes, Liens. Combats : tous les modes.)
  // Modérateur : une entrée « Modération » (vérifiée en ligne, une fois par session).
  const user = useAccount((s) => s.user);
  const [admin, setAdmin] = useState(false);
  useEffect(() => { if (user) void import('../../cloud/moderationCloud').then((m) => m.amIAdmin()).then(setAdmin).catch(() => {}); }, [user]);
  const groups: { title: string; items: Entry[] }[] = [
    { title: 'Ma partie', items: [
      { label: 'Sac', icon: 'bag', route: { name: 'inventory' } },
      { label: 'Codex', icon: 'book', route: { name: 'codex' } },
    ] },
    { title: 'Entre joueurs', items: [
      { label: 'Amis', icon: 'heroes', route: { name: 'friends' } },
      ...(isUnlocked(save, 'guild') ? [{ label: 'Clan', icon: 'team' as const, route: { name: 'guild' } as Route }] : []),
      { label: 'Classements', icon: 'star', route: { name: 'ranks' } },
      ...(admin ? [{ label: 'Modération', icon: 'lock' as const, route: { name: 'moderation' } as Route }] : []),
    ] },
    { title: 'Système', items: [
      { label: 'Sauvegarde et compte', icon: 'save', route: { name: 'saves' }, dot: !save.flags.saves_seen && !useAccount.getState().user && !cloudWanted() && save.stats.battlesWon >= 3 },
      { label: 'Paramètres', icon: 'gear', route: { name: 'settings' } },
    ] },
  ];
  return (
    <Screen title="Menu">
      <Profile />
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
      <p className="faint menu-map"><b>Héros</b> : Sanctuaire, Forge, Équipes, Liens · <b>Combats</b> : tous les modes · <b>Accueil</b> : Missions, Courrier, Camp, Marché.</p>
    </Screen>
  );
}

/** Carte du joueur : avatar, nom (modifiable), niveau et bilan de la partie. */
function Profile() {
  const save = useGame((s) => s.save)!;
  const mutate = useGame((s) => s.mutate);
  const toast = useUI((s) => s.toast);
  const push = useUI((s) => s.push);
  const [edit, setEdit] = useState<string | null>(null);
  const owned = new Set(save.heroes.map((h) => h.heroId)).size;
  const stats: [string, string][] = [
    ['Héros', `${owned}/${HEROES.length}`],
    ['Histoire', `${campProgress(save)}/90`],
    ['Tour', `${save.progress.tower.floor}/${TOWER_FLOORS}`],
    ['Arène', arenaTier(save.arena.rating).name],
    ['Victoires', fmt(save.stats.battlesWon)],
    ['Invocations', fmt(save.stats.summons)],
  ];
  const saveName = () => {
    const err = nameError(edit ?? '');
    if (err) { toast(err, 'error'); return; }
    mutate((s) => { s.profile.name = cleanName(edit ?? ''); s.flags.name_chosen = true; });
    setEdit(null); toast('Nom changé.', 'ok');
  };
  return (
    <div className="profile-card">
      <button className="pc-ava" onClick={() => push({ name: 'collection' })} aria-label="Changer d’avatar (dans Héros)"><HeroArt heroId={save.profile.avatarHeroId} /></button>
      <div className="grow" style={{ minWidth: 0 }}>
        <div className="row" style={{ gap: 6 }}>
          <b className="pc-name">{save.profile.name}</b>
          <button className="btn secondary small" onClick={() => setEdit(save.profile.name)}>Modifier</button>
        </div>
        <div className="faint">Le Lien · niveau {save.profile.level}</div>
      </div>
      <div className="pc-stats">
        {stats.map(([k, v]) => <div key={k}><b>{v}</b><span>{k}</span></div>)}
      </div>
      {edit != null && (
        <Modal onClose={() => setEdit(null)}>
          <h3 style={{ marginTop: 0 }}>Ton nom</h3>
          <p className="muted" style={{ marginTop: 0 }}>Les héros t’appellent ainsi dans l’histoire, et il apparaît dans les classements.</p>
          <input className="text-input" value={edit} maxLength={18} onChange={(e) => setEdit(e.target.value)} autoFocus aria-label="Ton nom" />
          <div className="row" style={{ gap: 8, marginTop: 12 }}>
            <button className="btn secondary grow" onClick={() => setEdit(null)}>Annuler</button>
            <button className="btn grow" onClick={saveName}>Valider</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
