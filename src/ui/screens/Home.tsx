import { useGame } from '../../state/store';
import { comingSoon, useUI } from '../../state/ui';
import { HERO_BY_ID } from '../../data/heroes';
import { FACTIONS } from '../../data/factions';
import { canClaimDaily } from '../../game/daily';
import { CHAPTERS_PLANNED } from '../../data/lore';
import { WorldScene, Particles } from '../art/Scene';
import { HeroArt } from '../art/HeroArt';
import { Icon } from '../art/Icons';
import { TopBar } from '../components/TopBar';

export function Home() {
  const save = useGame((s) => s.save)!;
  const now = useGame((s) => s.now);
  const push = useUI((s) => s.push);
  const tab = useUI((s) => s.tab);
  const team = save.teams.find((t) => t.id === save.activeTeamId) ?? save.teams[0];
  const leaderUid = team.leader ?? team.slots.find(Boolean);
  const leader = save.heroes.find((h) => h.uid === leaderUid) ?? save.heroes[0];
  const def = leader ? HERO_BY_ID[leader.heroId] : null;
  const daily = canClaimDaily(save, now);
  const reduced = save.settings.reducedMotion;

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
        <button className="side-btn locked" onClick={() => comingSoon('Missions journalières et hebdomadaires', 4)}>
          <span className="ic"><Icon.scroll /></span>Missions
        </button>
        <button className="side-btn" onClick={() => push({ name: 'codex' })}>
          <span className="ic"><Icon.book /></span>Codex
        </button>
      </div>
      <div className="home-side right">
        <button className="side-btn locked" onClick={() => comingSoon('Événements temporaires', 4)}>
          <span className="ic"><Icon.portal /></span>Événements
        </button>
        <button className="side-btn" onClick={() => push({ name: 'saves' })}>
          <span className="ic"><Icon.save /></span>Sauvegarde
        </button>
      </div>

      <div className="home-bottom">
        <button className="campaign-cta" onClick={() => comingSoon(`Campagne — Chapitre 1 : ${CHAPTERS_PLANNED[0].name}`, 2)}>
          <Icon.sword size={34} />
          <div className="grow">
            <div className="big">CAMPAGNE</div>
            <div className="sub">Chapitre 1 · {CHAPTERS_PLANNED[0].name}</div>
          </div>
          <span className="lock-tag" style={{ position: 'static' }}>PHASE 2</span>
        </button>
        <div className="mode-grid">
          <button className="mode-tile locked-tile" onClick={() => comingSoon('Invocations', 3)}><Icon.portal />Invoquer<span className="lock-tag">P3</span></button>
          <button className="mode-tile locked-tile" onClick={() => comingSoon('Donjons', 4)}><Icon.dungeon />Donjons<span className="lock-tag">P4</span></button>
          <button className="mode-tile locked-tile" onClick={() => comingSoon('Tour de progression', 4)}><Icon.tower />Tour<span className="lock-tag">P4</span></button>
          <button className="mode-tile" onClick={() => tab('collection')}><Icon.heroes />Héros</button>
        </div>
      </div>
    </div>
  );
}
