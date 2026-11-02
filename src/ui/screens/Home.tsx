import { useGame } from '../../state/store';
import { useUI } from '../../state/ui';
import { HERO_BY_ID } from '../../data/heroes';
import { FACTIONS } from '../../data/factions';
import { CHAPTERS } from '../../data/campaign';
import { chapterStars, isStageUnlocked, stageProgress } from '../../game/campaign';
import { claimableCount } from '../../game/missions';
import { activeEvents } from '../../game/events';
import { canClaimDaily } from '../../game/daily';
import { HeroArt, hasRealArt } from '../art/HeroArt';
import { WorldScene, Particles } from '../art/Scene';
import { Icon } from '../art/Icons';
import { TopBar } from '../components/TopBar';
import { unreadMail } from './Mail';

// ACCUEIL — l'illustration du chef d'équipe en plein écran, trois raccourcis, la campagne.
// Tout le reste est accessible par la barre du bas (Héros, Invoquer, Combats, Menu).
export function Home() {
  const save = useGame((s) => s.save)!;
  const now = useGame((s) => s.now);
  const push = useUI((s) => s.push);
  const team = save.teams.find((t) => t.id === save.activeTeamId) ?? save.teams[0];
  const leaderUid = team.leader ?? team.slots.find(Boolean);
  const leader = save.heroes.find((h) => h.uid === leaderUid) ?? save.heroes[0];
  const def = leader ? HERO_BY_ID[leader.heroId] : null;
  const real = def ? hasRealArt(def.id) : false;
  const nextStage = CHAPTERS.flatMap((c) => c.stages).find((st) => isStageUnlocked(save, 'normal', st) && stageProgress(save, 'normal', st.id).clears === 0);
  const stars = chapterStars(save, 'normal', nextStage?.chapter ?? CHAPTERS.length);
  const shortcuts = [
    { label: 'Missions', icon: Icon.scroll, dot: claimableCount(save) > 0, go: () => push({ name: 'missions' }) },
    { label: 'Événements', icon: Icon.calendar, dot: activeEvents(now).length > 0, go: () => push({ name: 'events' }) },
    { label: 'Courrier', icon: Icon.mail, dot: unreadMail(save.flags) || canClaimDaily(save, now), go: () => push({ name: unreadMail(save.flags) ? 'mail' : 'daily' }) },
  ];

  return (
    <div className="home screen">
      <div className="home-scene">
        {real && def ? (
          <div className="home-art"><HeroArt heroId={def.id} kind="full" position="center top" /></div>
        ) : (
          <><WorldScene />{!save.settings.reducedMotion && <Particles />}</>
        )}
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

      <div className="home-bottom">
        {def && (
          <button className="home-leader" onClick={() => push({ name: 'hero', uid: leader.uid, heroId: leader.heroId })}>
            <span className="hl-t">{FACTIONS[def.faction].short} · Chef d’équipe</span>
            <span className="hl-n">{def.name}</span>
          </button>
        )}
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
