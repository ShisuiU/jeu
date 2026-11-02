import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { ErrorBoundary } from './ui/components/ErrorBoundary';
import { Guide } from './ui/components/Guide';
import { useGame } from './state/store';
import { useUI, type Route } from './state/ui';
import { initSaveSystem } from './save/saveManager';
import { loadEvents } from './game/events';
import { configureAudio, play, unlockAudio } from './audio/sfx';
import { configureMusic, playMusic, stopMusic } from './audio/music';
import { canClaimDaily } from './game/daily';
import { BottomNav } from './ui/components/BottomNav';
import { Toasts } from './ui/components/Toasts';
import { Title } from './ui/screens/Title';
import { Home } from './ui/screens/Home';

// Écrans chargés à la demande (tous pré-cachés pour le hors-ligne) : démarrage plus rapide.
const L = <K extends string>(load: () => Promise<Record<K, React.ComponentType<any>>>, key: K) => lazy(() => load().then((m) => ({ default: m[key] })));
const Collection = L(() => import('./ui/screens/Collection'), 'Collection');
const HeroDetail = L(() => import('./ui/screens/HeroDetail'), 'HeroDetail');
const Team = L(() => import('./ui/screens/Team'), 'Team');
const Inventory = L(() => import('./ui/screens/Inventory'), 'Inventory');
const Menu = L(() => import('./ui/screens/Menu'), 'Menu');
const Daily = L(() => import('./ui/screens/Daily'), 'Daily');
const Settings = L(() => import('./ui/screens/Settings'), 'Settings');
const Saves = L(() => import('./ui/screens/Saves'), 'Saves');
const Codex = L(() => import('./ui/screens/Codex'), 'Codex');
const Campaign = L(() => import('./ui/screens/Campaign'), 'Campaign');
const Battle = L(() => import('./ui/screens/Battle'), 'Battle');
const Summon = L(() => import('./ui/screens/Summon'), 'Summon');
const Gear = L(() => import('./ui/screens/Gear'), 'Gear');
const Mail = L(() => import('./ui/screens/Mail'), 'Mail');
const Stage = L(() => import('./ui/screens/Stage'), 'Stage');
const Prep = L(() => import('./ui/screens/Stage'), 'Prep');
const Dungeons = L(() => import('./ui/screens/Modes'), 'Dungeons');
const Dungeon = L(() => import('./ui/screens/Modes'), 'Dungeon');
const Tower = L(() => import('./ui/screens/Modes'), 'Tower');
const WorldBoss = L(() => import('./ui/screens/Modes'), 'WorldBoss');
const Arena = L(() => import('./ui/screens/Modes'), 'Arena');
const Combats = L(() => import('./ui/screens/Combats'), 'Combats');
const Missions = L(() => import('./ui/screens/Missions'), 'Missions');
const Events = L(() => import('./ui/screens/Missions'), 'Events');

function renderRoute(r: Route) {
  switch (r.name) {
    case 'home': return <Home />;
    case 'collection': return <Collection />;
    case 'hero': return <HeroDetail key={r.uid ?? r.heroId} uid={r.uid} heroId={r.heroId} />;
    case 'team': return <Team />;
    case 'inventory': return <Inventory />;
    case 'menu': return <Menu />;
    case 'daily': return <Daily />;
    case 'settings': return <Settings />;
    case 'saves': return <Saves />;
    case 'codex': return <Codex />;
    case 'campaign': return <Campaign />;
    case 'summon': return <Summon />;
    case 'gear': return <Gear />;
    case 'mail': return <Mail />;
    case 'dungeons': return <Dungeons />;
    case 'dungeon': return <Dungeon key={r.dungeonId} dungeonId={r.dungeonId} />;
    case 'tower': return <Tower />;
    case 'worldboss': return <WorldBoss />;
    case 'arena': return <Arena />;
    case 'missions': return <Missions />;
    case 'events': return <Events />;
    case 'combats': return <Combats />;
    case 'stage': return <Stage key={r.stageId} stageId={r.stageId} />;
    case 'prep': return <Prep key={JSON.stringify(r.spec)} spec={r.spec} />;
    case 'battle': return <Battle key={r.seed} spec={r.spec} teamId={r.teamId} seed={r.seed} />;
  }
}

export default function App() {
  const save = useGame((s) => s.save);
  const route = useUI((s) => s.stack[s.stack.length - 1]);
  const depth = useUI((s) => s.stack.length);
  const [ready, setReady] = useState(false);
  const [started, setStarted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const booted = useRef(false);

  useEffect(() => {
    if (booted.current) return;
    booted.current = true;
    initSaveSystem()
      .then(() => setReady(true))
      .then(() => loadEvents(import.meta.env.BASE_URL))
      .catch((e) => setError(`Impossible d’accéder au stockage : ${e instanceof Error ? e.message : e}. Désactivez la navigation privée.`));
  }, []);

  // Horloge du jeu : énergie, renouvellements quotidiens.
  useEffect(() => {
    if (!ready) return;
    const id = setInterval(() => useGame.getState().tick(), 1000);
    return () => clearInterval(id);
  }, [ready]);

  useEffect(() => { if (save) configureAudio({ enabled: save.settings.sound, volume: save.settings.volume }); }, [save?.settings.sound, save?.settings.volume]);
  useEffect(() => { if (save) configureMusic({ enabled: save.settings.music, volume: save.settings.musicVolume }); }, [save?.settings.music, save?.settings.musicVolume]);
  // Musique : ambiance au menu, pulsation en combat ; coupée quand l'app passe en arrière-plan.
  useEffect(() => { if (started && save?.settings.music) playMusic(route.name === 'battle' ? 'battle' : 'menu'); }, [started, route.name, save?.settings.music]);
  useEffect(() => {
    const onVis = () => { if (document.visibilityState === 'hidden') stopMusic(); else if (started && useGame.getState().save?.settings.music) playMusic(useUI.getState().stack.at(-1)?.name === 'battle' ? 'battle' : 'menu'); };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [started]);

  const start = () => {
    unlockAudio();
    setStarted(true);
    setTimeout(() => play('claim'), 50);
    const s = useGame.getState();
    if (s.save && canClaimDaily(s.save, s.now)) useUI.getState().push({ name: 'daily' });
  };

  return (
    <div className={`app ${save?.settings.reducedMotion ? 'reduced-motion' : ''}`} onPointerDown={unlockAudio}>
      {!started || !save ? (
        <Title ready={ready && !!save} onStart={start} error={error} />
      ) : (
        <>
          <div key={`${depth}-${route.name}`} style={{ position: 'absolute', inset: 0 }}>
            <ErrorBoundary resetKey={`${depth}-${route.name}`}>
              <Suspense fallback={<div className="screen"><div className="bg-ambient" /></div>}>{renderRoute(route)}</Suspense>
            </ErrorBoundary>
          </div>
          {route.name !== 'battle' && <BottomNav />}
          {route.name === 'home' && !save.flags.guide_done && <Guide />}
        </>
      )}
      <Toasts />
    </div>
  );
}
