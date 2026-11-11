import worldArt from '../../assets/home/world-lien.webp';
import icWheel from '../../assets/home/wheel.webp';
import icCamp from '../../assets/home/camp.webp';
import icMarket from '../../assets/home/market.webp';
import icMissions from '../../assets/home/missions.webp';
import icMail from '../../assets/home/mail.webp';
import icEvents from '../../assets/home/events.webp';
import { wheelReady } from '../../game/wheel';
import { Coach } from '../components/Coach';
import { useGame } from '../../state/store';
import { useUI } from '../../state/ui';
import { CHAPTERS } from '../../data/campaign';
import { chapterStars, isStageUnlocked, stageProgress } from '../../game/campaign';
import { claimableCount, eventsDot } from '../../game/missions';
import { isUnlocked } from '../../game/unlocks';
import { canClaimDaily } from '../../game/daily';
import { Particles } from '../art/Scene';
import { Icon } from '../art/Icons';
import { TopBar } from '../components/TopBar';
import { unreadMail } from './Mail';
import { campElapsed } from '../../game/camp';
import { useGifts } from '../../state/gifts';

// ACCUEIL (v1.72.0, d'après la maquette SpriteCook) — le Monde Cousu sous le Cœur d'Aeon brisé, avec le Lien de dos
// au premier plan ; six boutons à icônes peintes dans des cadres dorés (lieux à gauche, suivi à droite) ; le grand
// panneau orné de la Campagne.
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
  const shortcuts = [
    { label: 'Missions', img: icMissions, dot: claimableCount(save) > 0, go: () => push({ name: 'missions' }) },
    { label: 'Courrier', img: icMail, dot: unreadMail(save.flags) || canClaimDaily(save, now) || gifts > 0, go: () => push({ name: 'mail' }) },
    ...(isUnlocked(save, 'events') ? [{ label: 'Événements', img: icEvents, dot: eventsDot(save, now), go: () => push({ name: 'events' }) }] : []),
  ];
  const places = [
    { label: 'Roue', img: icWheel, dot: wheelReady(save, now), go: () => push({ name: 'wheel' }) },
    ...(isUnlocked(save, 'camp') ? [{ label: 'Camp', img: icCamp, dot: campElapsed(save, now) >= 8 * 3600_000, go: () => push({ name: 'camp' }) }] : []),
    ...(isUnlocked(save, 'market') ? [{ label: 'Marché', img: icMarket, go: () => push({ name: 'market' }) }] : []),
  ];

  const chapter = CHAPTERS.find((c) => c.n === (nextStage?.chapter ?? CHAPTERS.length));
  const btn = (b: { label: string; img: string; dot?: boolean; go: () => void }) => (
    <button key={b.label} className="hb-btn" onClick={b.go} aria-label={b.label}>
      <span className="hb-frame"><img src={b.img} alt="" draggable={false} />{b.dot && <span className="badge-dot" />}</span>
      <span className="hb-label">{b.label}</span>
    </button>
  );

  return (
    <div className="home screen">
      <div className="home-scene">
        <div className="home-world2" aria-hidden>
          <img src={worldArt} alt="" draggable={false} />
          <div className="home-rift" />
          {!save.settings.reducedMotion && <Particles count={18} />}
        </div>
        <div className="home-shade" />
      </div>
      <TopBar />

      <div className="home-places">{places.map(btn)}</div>
      <div className="home-shortcuts">{shortcuts.map(btn)}</div>

      <Coach id="home_campaign" target=".campaign-cta" text="Ton aventure commence ici : touche Campagne." />
      <Coach id="home_summon" target=".nav-item:nth-child(3)" text="Première victoire ! Appelle de nouveaux Héritiers à l’Autel des Failles." />
      <Coach id="home_sanct" target=".nav-item:nth-child(2)" text="Fais progresser tes héros : ouvre Héros, puis le Sanctuaire." />
      <div className="home-bottom">
        <button className="campaign-cta ornate" onClick={() => push({ name: 'campaign' })}>
          <svg className="cc-gem" viewBox="0 0 120 40" aria-hidden>
            <defs>
              <linearGradient id="ccg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f2d9ff" /><stop offset="0.45" stopColor="#a66bff" /><stop offset="1" stopColor="#4a1f8a" /></linearGradient>
              <linearGradient id="ccb" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#8a6a33" stopOpacity="0" /><stop offset="0.5" stopColor="#f3d68f" /><stop offset="1" stopColor="#8a6a33" stopOpacity="0" /></linearGradient>
            </defs>
            <path d="M8 34 Q34 30 44 18 M112 34 Q86 30 76 18" fill="none" stroke="url(#ccb)" strokeWidth="2" />
            <path d="M60 2 L72 19 L60 38 L48 19 Z" fill="url(#ccg)" stroke="#e9c67a" strokeWidth="1.6" />
            <path d="M60 2 L60 38 M48 19 L72 19" stroke="rgba(255,255,255,0.45)" strokeWidth="0.8" />
          </svg>
          <span className="cc-corner tl" /><span className="cc-corner tr" /><span className="cc-corner bl" /><span className="cc-corner br" />
          <div className="big">Campagne</div>
          <div className="sub">{nextStage && chapter ? `Chapitre ${chapter.n} · ${chapter.name}` : 'Histoire terminée'}</div>
          <div className="cc-meta">{nextStage && <span>{nextStage.id} · {nextStage.name}</span>}<span className="cc-stars"><Icon.star size={13} /> {stars.stars}/{stars.max}</span></div>
        </button>
      </div>
    </div>
  );
}
