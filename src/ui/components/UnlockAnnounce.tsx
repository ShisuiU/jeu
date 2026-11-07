import { useEffect, useState } from 'react';
import { useGame } from '../../state/store';
import { useUI, type Route } from '../../state/ui';
import { WORLD_BOSS } from '../../data/worldBoss';
import { isUnlocked, UNLOCK_AT, type Feature } from '../../game/unlocks';
import { activeEvents } from '../../game/events';
import { HERO_BY_ID } from '../../data/heroes';
import { HeroArt } from '../art/HeroArt';
import { inTutorial } from './Coach';
import { Modal } from './common';
import { EnemyArt } from '../art/EnemyArt';
import { play } from '../../audio/sfx';

// ANNONCE D'UN NOUVEAU MODE — quand la campagne ouvre un mode, une fenêtre le présente en une phrase,
// avec un bouton pour y aller. Une seule fois par mode, jamais pendant le tutoriel ni en combat.

const INFO: Record<Feature, { title: string; text: string; art: string; hero?: boolean; route: Route }> = {
  market: { title: 'Marché', text: 'Chaque jour, 6 offres à acheter avec ton or : éclats, élixirs, potions et équipements.', art: 'lio', hero: true, route: { name: 'market' } },
  expeditions: { title: 'Expéditions', text: 'Envoie des héros en mission : ils reviennent avec du butin, même jeu fermé.', art: 'seam_stalker', route: { name: 'expeditions' } },
  events: { title: 'Événements', text: 'Chaque semaine, un nouvel événement : objectifs, épreuve et récompenses.', art: 'hollow_knight', route: { name: 'events' } },
  dungeons: { title: 'Donjons', text: 'Équipement et matériaux d’amélioration, étage après étage.', art: 'forge_golem', route: { name: 'dungeons' } },
  worldboss: { title: 'Boss mondial', text: 'Frappe le plus fort possible : 3 essais par jour, des coffres selon les dégâts.', art: WORLD_BOSS.enemy, route: { name: 'worldboss' } },
  arena: { title: 'Arène', text: 'Affronte les équipes d’autres Héritiers et grimpe les ligues.', art: 'hollow_knight', route: { name: 'arena' } },
  tower: { title: 'Tour des Âges', text: '50 étages sans énergie : jusqu’où iras-tu ?', art: 'tower_sentinel', route: { name: 'tower' } },
};
const ORDER = Object.keys(UNLOCK_AT) as Feature[];
const flag = (f: Feature) => `unl_${f}`;

export function UnlockAnnounce() {
  const save = useGame((s) => s.save)!;
  const mutate = useGame((s) => s.mutate);
  const [f, setF] = useState<Feature | null>(null);
  const [ev, setEv] = useState<string | null>(null);

  useEffect(() => {
    // Première fois avec cette version : les modes déjà ouverts sont considérés comme connus (pas de rafale de fenêtres).
    if (!save.flags.unl_init) { mutate((s) => { s.flags.unl_init = true; for (const x of ORDER) if (isUnlocked(s, x)) s.flags[flag(x)] = true; }); return; }
    if (inTutorial(save)) return;
    const next = ORDER.find((x) => isUnlocked(save, x) && !save.flags[flag(x)]);
    // Ensuite : un événement de connexion avec héros exclusif, présenté une fois.
    const special = !next && isUnlocked(save, 'events') ? activeEvents(save.time.highWater).find((e) => e.login && !save.flags[`ann_${e.id}`]) : undefined;
    if (!next && !special) return;
    const t = setTimeout(() => { if (!document.querySelector('.modal-backdrop, .sheet-backdrop, .coach')) { if (next) setF(next); else setEv(special!.id); play('rare'); } }, 600);
    return () => clearTimeout(t);
  }, [save]); // eslint-disable-line react-hooks/exhaustive-deps

  if (ev) {
    const e = activeEvents(save.time.highWater).find((x) => x.id === ev);
    const heroId = e?.login?.days.find((d) => d.hero)?.hero;
    const close = (go: boolean) => { mutate((s) => { s.flags[`ann_${ev}`] = true; }); setEv(null); if (go) useUI.getState().push({ name: 'events' }); };
    if (!e) return null;
    return (
      <Modal onClose={() => close(false)}>
        {heroId && <div className="unl-art hero"><HeroArt heroId={heroId} kind="full" /></div>}
        <div className="unl-tag">Nouvel événement</div>
        <h2>{e.name}</h2>
        <p className="muted" style={{ textAlign: 'center', marginTop: 0 }}>{heroId ? `Connecte-toi ${e.login!.days.length} jours : un cadeau chaque jour, et ${HERO_BY_ID[heroId].name.split(' ')[0]}, héroïne exclusive, au dernier.` : e.description}</p>
        <button className="btn block" onClick={() => close(true)}>Voir l’événement</button>
        <button className="btn secondary block" style={{ marginTop: 8 }} onClick={() => close(false)}>Plus tard</button>
      </Modal>
    );
  }
  if (!f) return null;
  const i = INFO[f];
  const close = (go: boolean) => { mutate((s) => { s.flags[flag(f)] = true; }); setF(null); if (go) useUI.getState().push(i.route); };
  return (
    <Modal onClose={() => close(false)}>
      {i.hero ? <div className="unl-art hero"><HeroArt heroId={i.art} kind="full" /></div> : <div className="unl-art"><EnemyArt enemyId={i.art} /></div>}
      <div className="unl-tag">{i.hero ? 'Nouveau lieu' : 'Nouveau mode'}</div>
      <h2>{i.title}</h2>
      <p className="muted" style={{ textAlign: 'center', marginTop: 0 }}>{i.text}</p>
      <button className="btn block" onClick={() => close(true)}>Y aller</button>
      <button className="btn secondary block" style={{ marginTop: 8 }} onClick={() => close(false)}>Plus tard</button>
    </Modal>
  );
}
