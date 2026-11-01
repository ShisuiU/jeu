import { useGame } from '../../state/store';
import { useUI } from '../../state/ui';
import { HERO_BY_ID } from '../../data/heroes';
import { FACTIONS } from '../../data/factions';
import { canClaimDaily } from '../../game/daily';
import { CHAPTERS } from '../../data/campaign';
import { chapterStars, isStageUnlocked, stageProgress } from '../../game/campaign';
import { WorldScene, Particles } from '../art/Scene';
import { HeroArt } from '../art/HeroArt';
import { Icon } from '../art/Icons';
import { TopBar } from '../components/TopBar';
import { claimableCount } from '../../game/missions';
import { activeEvents } from '../../game/events';
import { WORLD_BOSS } from '../../data/worldBoss';
import { ARENA } from '../../data/arena';
import { unreadMail } from './Mail';

export function Home() {
  const save = useGame((s) => s.save)!;
  const now = useGame((s) => s.now);
  const push = useUI((s) => s.push);
  const team = save.teams.find((t) => t.id === save.activeTeamId) ?? save.teams[0];
  const leaderUid = team.leader ?? team.slots.find(Boolean);
  const leader = save.heroes.find((h) => h.uid === leaderUid) ?? save.heroes[0];
  const def = leader ? HERO_BY_ID[leader.heroId] : null;
  const daily = canClaimDaily(save, now);
  const reduced = save.settings.reducedMotion;
  const allStages = CHAPTERS.flatMap((c) => c.stages);
  const nextStage = allStages.find((st) => isStageUnlocked(save, 'normal', st) && stageProgress(save, 'normal', st.id).clears === 0);
  const stars = chapterStars(save, 'normal', 1);
  const missionDot = claimableCount(save) > 0;
  const eventCount = activeEvents(now).length;
  const bossKeys = WORLD_BOSS.keysPerDay - save.worldBoss.keysUsed;
  const arenaTickets = ARENA.ticketsPerDay - save.arena.ticketsUsed;
  const summonDot = save.resources.shardAeon > 0 || save.resources.shardPrimal > 0 || !save.flags.gift_event_ash;

  return (
    <div className="home screen">
      <div className="home-scene">
        <WorldScene />
        {!reduced && <Particles />}
      </div>
      <TopBar />

      {def && (
        <button className="home-hero" onClick={() => push({ name: 'hero', uid: leader.uid, heroId: leader.heroId })}>
          <div className="art-wrap"><HeroArt heroId={def.id} kind="full" /></div>
          <div className="hero-label">
            <div className="t">{FACTIONS[def.faction].short} · Chef d’équipe</div>
            <div className="n">{def.name}</div>
          </div>
        </button>
      )}

      <div className="home-side left">
        <button className="side-btn" onClick={() => push({ name: 'daily' })}>
          <span className="ic"><Icon.gift /></span>Connexion{daily && <span className="badge-dot" />}
        </button>
        <button className="side-btn" onClick={() => push({ name: 'mail' })}>
          <span className="ic"><Icon.mail /></span>Courrier{unreadMail(save.flags) && <span className="badge-dot" />}
        </button>
        <button className="side-btn" onClick={() => push({ name: 'missions' })}>
          <span className="ic"><Icon.scroll /></span>Missions{missionDot && <span className="badge-dot" />}
        </button>
        <button className="side-btn" onClick={() => push({ name: 'codex' })}>
          <span className="ic"><Icon.book /></span>Codex
        </button>
      </div>
      <div className="home-side right">
        <button className="side-btn" onClick={() => push({ name: 'events' })}>
          <span className="ic"><Icon.portal /></span>Événements{eventCount > 0 && <span className="badge-dot" />}
        </button>
        <button className="side-btn" onClick={() => push({ name: 'worldboss' })}>
          <span className="ic"><Icon.skull /></span>Boss{bossKeys > 0 && <span className="badge-dot" />}
        </button>
        <button className="side-btn" onClick={() => push({ name: 'gear' })}>
          <span className="ic"><Icon.forge /></span>Forge
        </button>
        <button className="side-btn" onClick={() => push({ name: 'saves' })}>
          <span className="ic"><Icon.save /></span>Sauvegarde
        </button>
      </div>

      <div className="home-bottom">
        <button className="campaign-cta" onClick={() => push({ name: 'campaign' })}>
          <Icon.sword size={34} />
          <div className="grow">
            <div className="big">CAMPAGNE</div>
            <div className="sub">{nextStage ? `${nextStage.id} · ${nextStage.name}` : `Chapitre ${CHAPTERS[0].n} terminé`}</div>
          </div>
          <span className="chip" style={{ flexShrink: 0 }}><Icon.star size={13} /> {stars.stars}/{stars.max}</span>
        </button>
        <div className="mode-grid">
          <button className="mode-tile" onClick={() => push({ name: 'summon' })}><Icon.portal />Invoquer{summonDot && <span className="badge-dot" style={{ top: 6, right: 8 }} />}</button>
          <button className="mode-tile" onClick={() => push({ name: 'dungeons' })}><Icon.dungeon />Donjons</button>
          <button className="mode-tile" onClick={() => push({ name: 'tower' })}><Icon.tower />Tour</button>
          <button className="mode-tile" onClick={() => push({ name: 'arena' })}><Icon.arena />Arène{arenaTickets > 0 && <span className="badge-dot" style={{ top: 6, right: 8 }} />}</button>
        </div>
      </div>
    </div>
  );
}
