import { Coach } from '../components/Coach';
import { useGame } from '../../state/store';
import { useUI } from '../../state/ui';
import { HERO_BY_ID } from '../../data/heroes';
import { FACTIONS } from '../../data/factions';
import { CHAPTERS } from '../../data/campaign';
import { chapterStars, isStageUnlocked, stageProgress } from '../../game/campaign';
import { claimableCount, eventsDot } from '../../game/missions';
import { canClaimDaily } from '../../game/daily';
import { canImprove } from '../../game/upgrade';
import { HeroArt, hasRealArt } from '../art/HeroArt';
import { WorldScene, Particles } from '../art/Scene';
import { Icon } from '../art/Icons';
import { TopBar } from '../components/TopBar';
import { unreadMail } from './Mail';

// ACCUEIL — l'illustration du chef d'équipe en plein écran, les lieux (Sanctuaire, Forge),
// trois raccourcis, la campagne.
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
    { label: 'Événements', icon: Icon.calendar, dot: eventsDot(save, now), go: () => push({ name: 'events' }) },
    { label: 'Courrier', icon: Icon.mail, dot: unreadMail(save.flags) || canClaimDaily(save, now), go: () => push({ name: unreadMail(save.flags) ? 'mail' : 'daily' }) },
  ];

  const teamHeroes = team.slots.map((u) => save.heroes.find((h) => h.uid === u)).filter((h): h is NonNullable<typeof h> => !!h);
  const places = [
    { label: 'Sanctuaire', icon: Icon.temple, dot: teamHeroes.some((h) => canImprove(save, h)), go: () => push({ name: 'sanctuary' }) },
    { label: 'Forge', icon: Icon.forge, dot: false, go: () => push({ name: 'gear' }) },
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
      <Coach id="home_sanct" target='.sc-btn[aria-label="Sanctuaire"]' text="Fais progresser tes héros au Sanctuaire." />
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
