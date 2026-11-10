import worldArt from '../../assets/title/world.webp';
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

// ACCUEIL — l'illustration du chef d'équipe en plein écran, les lieux (Sanctuaire, Forge),
// trois raccourcis, la campagne.
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
    { label: 'Missions', icon: Icon.scroll, dot: claimableCount(save) > 0, go: () => push({ name: 'missions' }) },
    { label: 'Courrier', icon: Icon.mail, dot: unreadMail(save.flags) || canClaimDaily(save, now) || gifts > 0, go: () => push({ name: 'mail' }) },
    ...(isUnlocked(save, 'events') ? [{ label: 'Événements', icon: Icon.calendar, dot: eventsDot(save, now), go: () => push({ name: 'events' }) }] : []),
  ];
  const places = [
    { label: 'Roue', icon: Icon.wheel, dot: wheelReady(save, now), go: () => push({ name: 'wheel' }) },
    ...(isUnlocked(save, 'camp') ? [{ label: 'Camp', icon: Icon.gift, dot: campElapsed(save, now) >= 8 * 3600_000, go: () => push({ name: 'camp' }) }] : []),
    ...(isUnlocked(save, 'market') ? [{ label: 'Marché', icon: Icon.bag, go: () => push({ name: 'market' }) }] : []),
  ];

  return (
    <div className="home screen">
      <div className="home-scene">
        {/* Même décor que l'écran de lancement : le Monde Cousu sous le Cœur d'Aeon (v1.68.21). */}
        <div className="title-art home-world" aria-hidden>
          <img src={worldArt} alt="" draggable={false} />
          <div className="title-heart" />
          {!save.settings.reducedMotion && <Particles count={18} />}
        </div>
        <div className="home-shade" />
      </div>
      <TopBar />

      <div className="home-shortcuts">
        {shortcuts.map((s) => (
          <button key={s.label} className="sc-btn" onClick={s.go} aria-label={s.label}>
            <s.icon size={22} />
            {s.dot && <span className="badge-dot" />}
            <span className="sc-label">{s.label}</span>
          </button>
        ))}
      </div>

      <div className="home-places">
        {places.map((p) => (
          <button key={p.label} className="sc-btn place" onClick={p.go} aria-label={p.label}>
            <p.icon size={22} />
            {p.dot && <span className="badge-dot" />}
            <span className="sc-label">{p.label}</span>
          </button>
        ))}
      </div>

      <Coach id="home_campaign" target=".campaign-cta" text="Ton aventure commence ici : touche Campagne." />
      <Coach id="home_summon" target=".nav-item:nth-child(3)" text="Première victoire ! Appelle de nouveaux Héritiers à l’Autel des Failles." />
      <Coach id="home_sanct" target=".nav-item:nth-child(2)" text="Fais progresser tes héros : ouvre Héros, puis le Sanctuaire." />
      <div className="home-bottom">
        <button className="campaign-cta" onClick={() => push({ name: 'campaign' })}>
          <Icon.sword size={30} />
          <div className="grow">
            <div className="big">CAMPAGNE</div>
            <div className="sub">{nextStage ? `${nextStage.id} · ${nextStage.name}` : 'Histoire terminée'}</div>
          </div>
          <span className="chip" style={{ flexShrink: 0 }}><Icon.star size={13} /> {stars.stars}/{stars.max}</span>
        </button>
      </div>
    </div>
  );
}
