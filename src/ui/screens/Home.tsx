import bgArt from '../../assets/home/bg.webp';
import panelArt from '../../assets/home/panel.webp';
import bWheel from '../../assets/home/btn_wheel.webp';
import bCamp from '../../assets/home/btn_camp.webp';
import bMarket from '../../assets/home/btn_market.webp';
import bMissions from '../../assets/home/btn_missions.webp';
import bMail from '../../assets/home/btn_mail.webp';
import bEvents from '../../assets/home/btn_events.webp';
import bBuildings from '../../assets/home/btn_buildings.webp';
import { buildingsDot } from '../../game/buildings';
import { wheelReady } from '../../game/wheel';
import { Coach } from '../components/Coach';
import { useGame } from '../../state/store';
import { useUI } from '../../state/ui';
import { CHAPTERS } from '../../data/campaign';
import { chapterStars, isStageUnlocked, stageProgress } from '../../game/campaign';
import { claimableCount, eventsDot } from '../../game/missions';
import { isUnlocked, unlockText, type Feature } from '../../game/unlocks';
import { canClaimDaily } from '../../game/daily';
import { Particles } from '../art/Scene';
import { Icon } from '../art/Icons';
import { TopBar } from '../components/TopBar';
import { unreadMail } from './Mail';
import { campElapsed } from '../../game/camp';
import { useGifts } from '../../state/gifts';

// ACCUEIL (v1.72.4, kit SpriteCook) — en pièces séparées générées par SpriteCook : le décor de la maquette sans aucun bouton (refait par
// SpriteCook) remplit tout l'écran ; les six cadres d'icônes peintes se rangent sous la barre du haut ; le panneau orné
// de la Campagne se pose au-dessus de la barre du bas. Le jeu écrit les étiquettes, les points rouges et les textes.
// Tout le reste est accessible par la barre du bas (Héros, Invoquer, Combats, Menu).
export function Home() {
  const save = useGame((s) => s.save)!;
  const now = useGame((s) => s.now);
  const push = useUI((s) => s.push);
  const gifts = useGifts((s) => s.waiting);
  const nextStage = CHAPTERS.flatMap((c) => c.stages).find((st) => isStageUnlocked(save, 'normal', st) && stageProgress(save, 'normal', st.id).clears === 0);
  const stars = chapterStars(save, 'normal', nextStage?.chapter ?? CHAPTERS.length);
  // Accueil épuré : seulement ce qui se récupère ou se suit au quotidien. Un bouton n'apparaît qu'une fois son mode ouvert.
  // (Sanctuaire, Forge, Équipes, Liens : onglet Héros. Modes de combat : onglet Combats. Clan, amis : Menu.)
  const toast = useUI((st) => st.toast);
  // Les six cadres sont peints dans le décor : un lieu pas encore ouvert reste visible, assombri, avec un cadenas.
  type Spot = { label: string; side: 'l' | 'r'; row: 0 | 1 | 2 | 3; img: string; dot?: boolean; go: () => void; feature?: Feature };
  const spots: Spot[] = [
    { label: 'Roue', img: bWheel, side: 'l', row: 0, dot: wheelReady(save, now), go: () => push({ name: 'wheel' }) },
    { label: 'Camp', img: bCamp, side: 'l', row: 1, feature: 'camp', dot: campElapsed(save, now) >= 8 * 3600_000, go: () => push({ name: 'camp' }) },
    { label: 'Marché', img: bMarket, side: 'l', row: 2, feature: 'market', go: () => push({ name: 'market' }) },
    { label: 'Bâtiments', img: bBuildings, side: 'l', row: 3, dot: buildingsDot(save, now), go: () => push({ name: 'buildings' }) },
    { label: 'Missions', img: bMissions, side: 'r', row: 0, dot: claimableCount(save) > 0, go: () => push({ name: 'missions' }) },
    { label: 'Courrier', img: bMail, side: 'r', row: 1, dot: unreadMail(save.flags) || canClaimDaily(save, now) || gifts > 0, go: () => push({ name: 'mail' }) },
    { label: 'Événements', img: bEvents, side: 'r', row: 2, feature: 'events', dot: eventsDot(save, now), go: () => push({ name: 'events' }) },
  ];
  const chapter = CHAPTERS.find((c) => c.n === (nextStage?.chapter ?? CHAPTERS.length));

  return (
    <div className="home screen">
      <div className="home-scene">
        <img className="home-bg" src={bgArt} alt="" draggable={false} />
        <div className="home-rift" aria-hidden />
        {!save.settings.reducedMotion && <div className="home-sky-motes" aria-hidden><Particles count={10} /></div>}
        <div className="home-shade" />
      </div>
      <TopBar />

      {(['l', 'r'] as const).map((side) => (
        <div key={side} className={`hs-col ${side}`}>
          {spots.filter((sp) => sp.side === side).map((sp) => {
            const locked = !!sp.feature && !isUnlocked(save, sp.feature);
            return (
              <button key={sp.label} className={`hs-btn ${locked ? 'locked' : ''}`} aria-label={sp.label}
                onClick={() => (locked ? toast(`${sp.label} : ${unlockText(sp.feature!).toLowerCase()} de la campagne.`) : sp.go())}>
                <img src={sp.img} alt="" draggable={false} />
                {locked && <span className="hs-lock"><Icon.lock size={18} /></span>}
                {!locked && sp.dot && <span className="badge-dot" />}
                <span className={`hs-label ${sp.label.length > 8 ? 'long' : ''}`}>{sp.label}</span>
              </button>
            );
          })}
        </div>
      ))}

      <div className="home-bottom">
        <button className="campaign-cta hs-campaign" onClick={() => push({ name: 'campaign' })}>
          <img src={panelArt} alt="" draggable={false} />
          <span className="big">Campagne</span>
          <span className="sub">{nextStage && chapter ? `Chapitre ${chapter.n} — ${chapter.name}` : 'Histoire terminée'}</span>
          <span className="cc-stars"><Icon.star size={15} /> {stars.stars} / {stars.max}</span>
        </button>
      </div>

      <Coach id="home_campaign" target=".campaign-cta" text="Ton aventure commence ici : touche Campagne." />
      <Coach id="home_summon" target=".nav-item:nth-child(3)" text="Première victoire ! Appelle de nouveaux Héritiers à l’Autel des Failles." />
      <Coach id="home_sanct" target=".nav-item:nth-child(2)" text="Fais progresser tes héros : ouvre Héros, puis le Sanctuaire." />
    </div>
  );
}
