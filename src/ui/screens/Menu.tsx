import icBag from '../../assets/kit/ic_bag.webp';
import icCodex from '../../assets/kit/ic_codex.webp';
import icHand from '../../assets/kit/ic_hand.webp';
import icBanner from '../../assets/kit/ic_banner.webp';
import icTrophy from '../../assets/kit/ic_trophy.webp';
import icSave from '../../assets/kit/ic_save.webp';
import icGear from '../../assets/kit/ic_gear.webp';
import icHelp from '../../assets/kit/ic_help.webp';
import icHero from '../../assets/kit/ic_hero.webp';
import icBook from '../../assets/kit/ic_book.webp';
import icTower from '../../assets/kit/ic_tower.webp';
import icLaurel from '../../assets/kit/ic_laurel.webp';
import icSwords from '../../assets/kit/ic_swords.webp';
import icCrystal from '../../assets/kit/ic_crystal.webp';
// Icônes peintes du kit SpriteCook (v1.73.0).
const TILE_ICON: Record<string, string> = { 'Sac': icBag, 'Codex': icCodex, 'Amis': icHand, 'Clan': icBanner, 'Classements': icTrophy, 'Sauvegarde et compte': icSave, 'Paramètres': icGear, 'Modération': icHelp };
const STAT_ICON: Record<string, string> = { 'Héros': icHero, 'Histoire': icBook, 'Tour': icTower, 'Arène': icLaurel, 'Victoires': icSwords, 'Invocations': icCrystal };
import { cloudWanted, useAccount } from '../../cloud/account';
import { isUnlocked } from '../../game/unlocks';
import { useGame } from '../../state/store';
import { useUI, type Route } from '../../state/ui';
import { useEffect, useState } from 'react';
import { Modal, Screen, fmt } from '../components/common';
import { RewardView } from '../components/RewardView';
import { redeemPromo } from '../../game/promo';
import type { PromoCode } from '../../data/promoCodes';
import { play } from '../../audio/sfx';
import { Icon } from '../art/Icons';
import { HeroArt } from '../art/HeroArt';
import { HEROES } from '../../data/heroes';
import { TOWER_FLOORS } from '../../data/tower';
import { arenaTier } from '../../data/arena';
import { campProgress } from '../../game/camp';
import { cleanName, nameError } from '../../game/profile';

type Entry = { label: string; icon: keyof typeof Icon; route?: Route; action?: () => void; dot?: boolean };

export function Menu() {
  const [promo, setPromo] = useState(false);
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
      { label: 'Code promo', icon: 'gift', action: () => setPromo(true) },
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
                <button key={e.label} className="menu-tile kit" onClick={() => (e.action ? e.action() : e.route && push(e.route))}>
                  {TILE_ICON[e.label] ? <img className="mt-ico" src={TILE_ICON[e.label]} alt="" /> : <I size={24} />}
                  <span>{e.label}</span>
                  {e.dot && <span className="badge-dot" style={{ top: 8, right: 10 }} />}
                </button>
              );
            })}
          </div>
        </div>
      ))}
      {promo && <PromoModal onClose={() => setPromo(false)} />}
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
      <button className="pc-ava" onClick={() => push({ name: 'profile' })} aria-label="Mon profil"><HeroArt heroId={save.profile.avatarHeroId} /></button>
      <div className="grow" style={{ minWidth: 0 }}>
        <div className="row" style={{ gap: 6 }}>
          <b className="pc-name">{save.profile.name}</b>
          <button className="btn secondary small" onClick={() => setEdit(save.profile.name)}>Modifier</button>
        </div>
        <div className="faint">Le Lien · niveau {save.profile.level}</div>
      </div>
      <div className="pc-stats">
        {stats.map(([k, v]) => <div key={k}><img src={STAT_ICON[k]} alt="" /><span>{k}</span><b>{v}</b></div>)}
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

/** Code promo (v1.77.0) : un champ, un bouton ; la récompense s'affiche quand le code est accepté. */
function PromoModal({ onClose }: { onClose: () => void }) {
  const mutate = useGame((s) => s.mutate);
  const toast = useUI((s) => s.toast);
  const [code, setCode] = useState('');
  const [done, setDone] = useState<PromoCode | null>(null);
  const submit = () => {
    let res = { ok: false, reason: '' } as ReturnType<typeof redeemPromo>;
    mutate((s) => { res = redeemPromo(s, code, Date.now()); });
    if (!res.ok) { toast(res.reason, 'error'); return; }
    play('claim'); setDone(res.promo); setCode('');
  };
  return (
    <Modal onClose={onClose}>
      <h2>Code promo</h2>
      {done ? (
        <>
          <p className="muted" style={{ textAlign: 'center', marginTop: 0 }}>{done.label} : récompense ajoutée !</p>
          <RewardView reward={done.reward} compact />
          <div className="row" style={{ gap: 8, marginTop: 12 }}>
            <button className="btn secondary grow" onClick={() => setDone(null)}>Autre code</button>
            <button className="btn grow" onClick={onClose}>Super</button>
          </div>
        </>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); submit(); }}>
          <p className="muted" style={{ textAlign: 'center', marginTop: 0 }}>Entre un code reçu (événement, réseaux, amis) pour obtenir une récompense. Chaque code ne sert qu’une fois.</p>
          <input className="promo-input" value={code} onChange={(e) => setCode(e.target.value)} placeholder="EX. AEONFALL" autoCapitalize="characters" autoComplete="off" spellCheck={false} maxLength={24} aria-label="Code promo" />
          <button className="btn block" style={{ marginTop: 10 }} type="submit" disabled={!code.trim()}>Valider</button>
        </form>
      )}
    </Modal>
  );
}
