import { useState } from 'react';
import { useGame } from '../../state/store';
import { useUI } from '../../state/ui';
import { HEROES, HERO_BY_ID } from '../../data/heroes';
import { RARITIES } from '../../data/rarities';
import { CHAPTERS, DIFFICULTIES, DIFFICULTY_ORDER } from '../../data/campaign';
import { TOWER_FLOORS } from '../../data/tower';
import { DUNGEONS, DUNGEON_FLOORS } from '../../data/dungeons';
import { arenaTier } from '../../data/arena';
import { stageProgress } from '../../game/campaign';
import { difficultyStars } from '../../game/starChests';
import { dungeonBest, dungeonTopDiff } from '../../game/dungeons';
import { collectionPct } from '../../game/collection';
import { cleanName, nameError } from '../../game/profile';
import { Modal, Panel, Screen, fmt } from '../components/common';
import { AccountXp } from '../components/AccountXp';
import { HeroArt } from '../art/HeroArt';
import { Icon } from '../art/Icons';

// PROFIL DU JOUEUR (v1.68.21) — ouvert depuis l'avatar en haut à gauche : avatar et cadre, nom, niveau,
// et un bilan simple de la progression (collection, campagne par difficulté, donjons, tour, arène…).

/** Cadres d'avatar : le premier est celui de tous les Liens ; les autres arriveront plus tard. */
const FRAMES = [
  { id: 'lien', name: 'Lien', cls: 'fr-lien', hint: 'Le cadre de tous les Liens.' },
  { id: 'arena', name: 'Gladiateur', cls: 'fr-arena', hint: 'Bientôt : finir une saison d’Arène en ligue Or.' },
  { id: 'night', name: 'Cauchemar', cls: 'fr-night', hint: 'Bientôt : terminer la campagne en Cauchemar.' },
  { id: 'aeon', name: 'Cœur d’Aeon', cls: 'fr-aeon', hint: 'Bientôt : posséder 100 héros.' },
];

export function Profile() {
  const save = useGame((s) => s.save)!;
  const mutate = useGame((s) => s.mutate);
  const toast = useUI((s) => s.toast);
  const push = useUI((s) => s.push);
  const [edit, setEdit] = useState<string | null>(null);
  const [pickAva, setPickAva] = useState(false);

  const owned = [...new Set(save.heroes.map((h) => h.heroId))];
  const stagesTotal = CHAPTERS.reduce((a, c) => a + c.stages.length, 0);
  const cleared = (d: (typeof DIFFICULTY_ORDER)[number]) => CHAPTERS.reduce((a, c) => a + c.stages.filter((st) => stageProgress(save, d, st.id).clears > 0).length, 0);
  const tier = arenaTier(save.arena.rating);
  const saveName = () => {
    const err = nameError(edit ?? '');
    if (err) { toast(err, 'error'); return; }
    mutate((s) => { s.profile.name = cleanName(edit ?? ''); s.flags.name_chosen = true; });
    setEdit(null); toast('Nom changé.', 'ok');
  };

  return (
    <Screen title="Profil">
      <div className="pf-head">
        <button className="pf-ava fr-lien" onClick={() => setPickAva(true)} aria-label="Changer d’avatar">
          <HeroArt heroId={save.profile.avatarHeroId} />
          <span className="pf-lvl">{save.profile.level}</span>
        </button>
        <div className="grow" style={{ minWidth: 0 }}>
          <div className="row" style={{ gap: 8 }}>
            <b className="pf-name">{save.profile.name}</b>
            <button className="btn secondary small" onClick={() => setEdit(save.profile.name)}>Modifier</button>
          </div>
          <div className="faint">Le Lien · niveau de compte {save.profile.level}</div>
          <AccountXp compact level={save.profile.level} xp={save.profile.xp} />
        </div>
      </div>

      <Panel title="Cadre d’avatar">
        <div className="pf-frames">
          {FRAMES.map((f, i) => (
            <button key={f.id} className={`pf-frame ${i === 0 ? 'on' : 'locked'}`} onClick={() => toast(f.hint)}>
              <span className={`pf-fr-prev ${f.cls}`}><HeroArt heroId={save.profile.avatarHeroId} /></span>
              <span>{f.name}</span>
              {i > 0 && <small>Bientôt</small>}
            </button>
          ))}
        </div>
      </Panel>

      <Panel title="Ma progression">
        <div className="pf-grid">
          <div><b>{owned.length}<small>/{HEROES.length}</small></b><span>Héros</span></div>
          <div><b>+{collectionPct(save)} %</b><span>Bonus de collection</span></div>
          <div><b>{save.progress.tower.floor}<small>/{TOWER_FLOORS}</small></b><span>Tour des Âges</span></div>
          <div><b style={{ color: tier.color }}>{tier.name}</b><span>Arène · {save.arena.rating} pts</span></div>
          <div><b>{fmt(save.stats.battlesWon)}</b><span>Combats gagnés</span></div>
          <div><b>{fmt(save.stats.summons)}</b><span>Invocations</span></div>
        </div>
        <div className="pf-sub">Campagne</div>
        {DIFFICULTY_ORDER.map((d) => {
          const c = cleared(d);
          const st = difficultyStars(save, d);
          return (
            <div key={d} className="pf-row">
              <span>{DIFFICULTIES[d].name}</span>
              <div className="progress grow"><div style={{ width: `${(c / stagesTotal) * 100}%` }} /></div>
              <span className="faint nowrap">{c}/{stagesTotal} · <Icon.star size={12} /> {st}</span>
            </div>
          );
        })}
        <div className="pf-sub">Donjons</div>
        {DUNGEONS.map((dg) => {
          const top = dungeonTopDiff(save, dg.id);
          const best = dungeonBest(save, dg.id, top);
          return (
            <div key={dg.id} className="pf-row">
              <span style={{ color: dg.color }}>{dg.name}</span>
              <span className="faint nowrap" style={{ marginLeft: 'auto' }}>{top !== 'normal' ? `${DIFFICULTIES[top].name} · ` : ''}étage {best}/{DUNGEON_FLOORS}</span>
            </div>
          );
        })}
      </Panel>

      <div className="row" style={{ gap: 8 }}>
        <button className="btn secondary grow" onClick={() => push({ name: 'saves' })}><Icon.save size={16} /> Sauvegarde</button>
        <button className="btn secondary grow" onClick={() => push({ name: 'settings' })}><Icon.gear size={16} /> Paramètres</button>
      </div>

      {pickAva && (
        <Modal onClose={() => setPickAva(false)}>
          <h2>Choisir ton avatar</h2>
          <div className="pf-avas">
            {owned.map((id) => (
              <button key={id} className={`pf-ava-pick ${id === save.profile.avatarHeroId ? 'on' : ''}`} style={{ ['--rc' as string]: RARITIES[HERO_BY_ID[id].rarity].color }}
                onClick={() => { mutate((s) => { s.profile.avatarHeroId = id; }); setPickAva(false); toast('Avatar changé.', 'ok'); }} aria-label={HERO_BY_ID[id].name}>
                <HeroArt heroId={id} />
              </button>
            ))}
          </div>
          <button className="btn secondary block" style={{ marginTop: 12 }} onClick={() => setPickAva(false)}>Fermer</button>
        </Modal>
      )}
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
    </Screen>
  );
}
